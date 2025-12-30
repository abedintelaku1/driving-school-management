const Package = require('../models/Package');

const list = async (_req, res, next) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.json(packages);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({ message: 'Package not found' });
        }
        res.json(pkg);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, category, numberOfHours, price, description, status } = req.body;
        
        // Validate required fields
        if (!name || !category || !numberOfHours || price === undefined) {
            return res.status(400).json({ 
                message: 'All required fields must be provided' 
            });
        }
        
        // Validate numeric fields
        if (typeof numberOfHours !== 'number' || numberOfHours < 1) {
            return res.status(400).json({ 
                message: 'Number of hours must be a positive number' 
            });
        }
        
        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({ 
                message: 'Price must be a non-negative number' 
            });
        }
        
        // Create package
        const pkg = await Package.create({
            name: name.trim(),
            category: category.trim(),
            numberOfHours,
            price,
            description: description ? description.trim() : '',
            status: status || 'active'
        });
        
        res.status(201).json(pkg);
    } catch (err) {
        console.error('Error creating package:', err);
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, category, numberOfHours, price, description, status } = req.body;
        
        const pkg = await Package.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({ message: 'Package not found' });
        }
        
        // Update fields
        if (name !== undefined) pkg.name = name.trim();
        if (category !== undefined) pkg.category = category.trim();
        if (numberOfHours !== undefined) {
            if (typeof numberOfHours !== 'number' || numberOfHours < 1) {
                return res.status(400).json({ 
                    message: 'Number of hours must be a positive number' 
                });
            }
            pkg.numberOfHours = numberOfHours;
        }
        if (price !== undefined) {
            if (typeof price !== 'number' || price < 0) {
                return res.status(400).json({ 
                    message: 'Price must be a non-negative number' 
                });
            }
            pkg.price = price;
        }
        if (description !== undefined) pkg.description = description.trim();
        if (status !== undefined) pkg.status = status;
        
        await pkg.save();
        
        res.json(pkg);
    } catch (err) {
        console.error('Error updating package:', err);
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) {
            return res.status(404).json({ message: 'Package not found' });
        }
        
        await Package.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Package deleted successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    create,
    update,
    remove
};

