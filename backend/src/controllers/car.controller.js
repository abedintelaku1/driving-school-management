const Car = require('../models/Car');

const list = async (req, res, next) => {
    try {
        const cars = await Car.find().sort({ createdAt: -1 });
        res.json(cars);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.json(car);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const car = await Car.create(req.body);
        res.status(201).json(car);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'License plate already exists' });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.json(car);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'License plate already exists' });
        }
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.json({ message: 'Car deleted' });
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


