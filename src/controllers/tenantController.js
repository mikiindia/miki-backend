const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tenant = require('../models/tenantSchema');
const Admin = require('../models/adminSchema');
const MasterUser = require('../models/masterUserSchema');
const logger = require('../utils/logger');
const getNextSequenceId = require('../utils/nextSequenceId');
const logUserActivity = require('../utils/activityLogger');
const { getNextTenantID } = require('../utils/sequenceTenantID');
const { getNextAdminID } = require('../utils/sequenceAdminID');
const { createTenantCollections } = require('../utils/DynamicCollection');
const insertDefaultRoles = require('../utils/insertRoles');

dotenv.config();

const tenantRegister = async (req, res) => {
    const { ipAddress, requestMethod, deviceInfo } = req.metadata || {}, endpoint = req.originalUrl;
    const createdBy = req.user?.userId || 'system';

    try {
        let { tenantName, companyName, companySize, registrationNumber, country, industryType, email_id, password, phone_number, address, roleId } = req.body;

        if (!tenantName || !companyName || !companySize || !registrationNumber || !country || !industryType || !email_id || !password || !phone_number || !address)
            return res.status(400).json({ status: 400, message: 'All fields are required' });

        if (/\d/.test(tenantName))
            return res.status(400).json({ status: 400, message: 'Tenant name should not contain numbers' });

        if (!['Small', 'Medium', 'Large'].includes(companySize))
            return res.status(400).json({ status: 400, message: 'Company size must be Small, Medium, or Large' });

        if (!/^[A-Z]/.test(country))
            return res.status(400).json({ status: 400, message: 'Country name must start with a capital letter.' });

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_id))
            return res.status(400).json({ status: 400, message: 'Invalid email format' });

        if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,15}$/.test(password))
            return res.status(400).json({ status: 400, message: 'Password must be 10-15 characters with letters, numbers, and a special character' });

        if (!/^\d{10,12}$/.test(phone_number))
            return res.status(400).json({ status: 400, message: 'Phone number must be 10-12 digits' });

        const domain = companyName.split(' ')[0].toLowerCase() + '.dodeel.com/';
        const existingTenant = await Tenant.findOne({ $or: [{ email_id, status: 1 }, { companyName, domain, status: 1 }] });

        if (existingTenant)
            return res.status(400).json({ status: 400, message: 'Email or Company Name with this domain already exists' });

        const tenantid = await getNextTenantID();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newTenant = new Tenant({
            _id: new mongoose.Types.ObjectId(), tenantId:tenantid, tenantName, companyName, companySize, registrationNumber,
            country, domain, industryType, email_id, phone_number, password_hash: hashedPassword, address,
            roleId, isVerified: false, status: 1, audit: { createdBy, createdAt: new Date() }
        });

        await newTenant.save();
        logger.info(`✅ Tenant registered successfully: ${tenantId}`);

        const tenantId = newTenant._id; // Use the generated ObjectId


        // Create collections for the tenant
        await createTenantCollections(tenantId);

        // Insert default roles
        await insertDefaultRoles(tenantId);

        // Connect to tenant DB and insert admin
        const tenantDb = mongoose.connection.useDb(tenantId.toString());
        const TenantAdmin = tenantDb.model("Admin", Admin.schema);
        
        const _id = await getNextSequenceId("adminId");
        const adminId = await getNextAdminID();
        const newAdmin = new TenantAdmin({
            _id ,
            adminId,
            companyId: tenantId.toString(),
            fullName: tenantName,
            email_id,
            phone_Number: phone_number,
            password_hash: hashedPassword,
            roleId:'role_002',
            isVerified: true,
            status: 1,
            audit: { createdBy, createdAt: new Date() }
        });

        await newAdmin.save();
        logger.info(`✅ Admin created for tenant: ${tenantId}`);

        // Insert into MasterUser collection in the main DB (mikiapidb) -
        const masterUserId = await getNextSequenceId("masterUserId");
        const newMasterUser = new MasterUser({
            _id: masterUserId,
            userId: adminId,
            user_name: tenantName,
            phone_Number: phone_number,
            email_id,
            password_hash: hashedPassword, 
            roleId: 'role_002',
            tenant_ID: tenantId.toString(),
            isSuperAdmin: 0,
            isTenant: 1,
            isTenantUser: 0,
            isBusinessDeveloper: 0,
            status: 1
        });

        await newMasterUser.save();
        logger.info(`✅ Master user created for tenant: ${tenantId}`);

        await logUserActivity({userId: createdBy,activityType: 'REGISTER_TENANT', activityDetails: `Registered new tenant: ${companyName}`, ipAddress, deviceInfo,endpoint,method: requestMethod || req.method,activityStatus: 'success'
        });

        res.status(201).json({ status: 201, message: 'Tenant registered successfully' });

    } catch (error) {
        logger.error(`❌ Error in tenant registration: ${error.message}`);
        await logUserActivity({
            userId: createdBy,activityType: 'REGISTER_TENANT',  activityDetails: `Error registering tenant: ${req.body.companyName}`, ipAddress, deviceInfo, endpoint, method: requestMethod || req.method,activityStatus: 'failed', errorMessage: error.message
        }).catch(console.error);
        res.status(500).json({ status: 500, message: 'Server Error while registering tenant', error });
    }
};

 

// Tenant Login
const tenantLogin = async (req, res) => {
    try {
        const { email_id, password } = req.body;

        // Check if tenant exists
        const tenant = await Tenant.findOne({ email_id, status: 1 });
        if (!tenant) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, tenant.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 401, message: 'Invalid credentials' });
        }

        // Generate JWT Token
        const payload = { tenantId: tenant.tenantId, email_id: tenant.email_id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ status: 200, message: 'Login successful', token });

    } catch (error) {
        logger.error(`Error in tenant login: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Server Error while logging in' });
    }
};

// Get Tenant Details
const getTenantDetails = async (req, res) => {
    try {
        const tenants = await Tenant.find({ status: 1 }).select('-password_hash');
        res.status(200).json({ status: 200, data: tenants });

    } catch (error) {
        logger.error(`Error fetching tenants: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Server Error while fetching tenants' });
    }
};

// Get Tenant by Tenant ID
const getTenantById = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const tenant = await Tenant.findOne({ tenantId, status: 1 }).select('-password_hash');

        if (!tenant) {
            return res.status(404).json({ status: 404, message: 'Tenant not found' });
        }

        res.status(200).json({ status: 200, data: tenant });

    } catch (error) {
        logger.error(`Error fetching tenant: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Server Error while fetching tenant' });
    }
};

// Update Tenant
const updateTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const updateData = req.body;

        // Prevent password update directly
        if (updateData.password) {
            delete updateData.password;
        }

        updateData.audit = { updatedBy: req.user.email_id, updatedAt: new Date() };

        const updatedTenant = await Tenant.findOneAndUpdate({ tenantId }, updateData, { new: true });

        if (!updatedTenant) {
            return res.status(404).json({ status: 404, message: 'Tenant not found' });
        }

        res.status(200).json({ status: 200, message: 'Tenant updated successfully', data: updatedTenant });

    } catch (error) {
        logger.error(`Error updating tenant: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Server Error while updating tenant' });
    }
};

// Delete Tenant
const deleteTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const deletedTenant = await Tenant.findOneAndUpdate({ tenantId }, { status: 0 }, { new: true });

        if (!deletedTenant) {
            return res.status(404).json({ status: 404, message: 'Tenant not found' });
        }

        res.status(200).json({ status: 200, message: 'Tenant deleted successfully' });

    } catch (error) {
        logger.error(`Error deleting tenant: ${error.message}`);
        res.status(500).json({ status: 500, message: 'Server Error while deleting tenant' });
    }
};

module.exports = {
    tenantRegister,
    tenantLogin,
    getTenantDetails,
    getTenantById,
    updateTenant,
    deleteTenant
};
