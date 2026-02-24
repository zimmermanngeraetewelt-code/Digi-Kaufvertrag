const express = require('express');
const router = express.Router();
const { Contract } = require('../models');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all contracts (Technicians see only their own)
// @route   GET /api/contracts
router.get('/', protect, async (req, res) => {
    try {
        const queryOptions = {
            order: [['createdAt', 'DESC']],
        };

        // Non-admins only see their own contracts
        if (req.user.role !== 'Admin') {
            queryOptions.where = { technicianId: req.user.id };
        }

        const contracts = await Contract.findAll(queryOptions);
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Export all contracts for Admin
// @route   GET /api/contracts/export
router.get('/export', protect, authorize('Admin'), async (req, res) => {
    try {
        const contracts = await Contract.findAll({
            order: [['createdAt', 'DESC']],
        });
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single contract
// @route   GET /api/contracts/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const contract = await Contract.findByPk(req.params.id);
        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Security check: Admin or owner only
        if (req.user.role !== 'Admin' && contract.technicianId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this contract' });
        }

        res.json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a contract
// @route   POST /api/contracts
router.post('/', protect, async (req, res) => {
    try {
        const {
            invoiceNr, technicianName, date, appointmentDate, appointmentTime,
            deviceType, items, sum, paymentMethod, vatAmount, totalAmount,
            customerName, customerAddress, isPhoneOrder
        } = req.body;

        const contract = await Contract.create({
            invoiceNr,
            technicianName,
            date,
            appointmentDate,
            appointmentTime,
            deviceType,
            items,
            sum,
            paymentMethod,
            vatAmount,
            totalAmount,
            customerName,
            customerAddress,
            isPhoneOrder,
            status: 'Draft',
            technicianId: req.user.id
        });

        req.app.get('io').emit('contractCreated', contract);
        res.status(201).json(contract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update/Sign contract
// @route   PUT /api/contracts/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const contract = await Contract.findByPk(req.params.id);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Security check: Admin or owner only
        if (req.user.role !== 'Admin' && contract.technicianId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this contract' });
        }

        const updatedContract = await contract.update(req.body);
        req.app.get('io').emit('contractUpdated', updatedContract);
        res.json(updatedContract);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete contract
// @route   DELETE /api/contracts/:id
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        const contract = await Contract.findByPk(req.params.id);
        if (contract) {
            const id = contract.id;
            await contract.destroy();
            req.app.get('io').emit('contractDeleted', id);
            res.json({ message: 'Contract removed' });
        } else {
            res.status(404).json({ message: 'Contract not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Public Remote Signing Routes ---

// @desc    Get contract details (public subset)
// @route   GET /api/contracts/public/:id
router.get('/public/:id', async (req, res) => {
    try {
        const contract = await Contract.findByPk(req.params.id, {
            attributes: ['id', 'invoiceNr', 'customerName', 'totalAmount', 'signatureReceived']
        });
        if (contract) {
            res.json(contract);
        } else {
            res.status(404).json({ message: 'Not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Submit signature (public)
// @route   PUT /api/contracts/public/sign/:id
router.put('/public/sign/:id', async (req, res) => {
    try {
        const contract = await Contract.findByPk(req.params.id);
        if (!contract) return res.status(404).json({ message: 'Not found' });

        if (contract.status === 'Signed' && req.body.type === 'customer') {
            return res.status(400).json({ message: 'Kaufvertrag ist bereits unterschrieben.' });
        }

        const { signature, type } = req.body; // type: 'customer' or 'technician'

        const updateData = {};
        if (type === 'customer') {
            updateData.customerSignature = signature;
            updateData.signatureReceived = true;
            updateData.status = 'Signed';
        } else {
            updateData.technicianSignature = signature;
        }

        const updatedContract = await contract.update(updateData);
        req.app.get('io').emit('contractUpdated', updatedContract);
        req.app.get('io').emit('signatureReceived', { id: contract.id, type, signature });

        res.json({ message: 'Signature received' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
