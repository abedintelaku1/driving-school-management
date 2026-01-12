const Car = require("../models/Car");

const list = async (_req, res, next) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    next(err);
  }
};

// Get cars assigned to the logged-in instructor (includes both assigned school cars and personal cars)
const getMyCars = async (req, res, next) => {
  try {
    // Get the instructor document for this user
    const Instructor = require("../models/Instructor");
    const instructor = await Instructor.findOne({ user: req.user._id });

    if (!instructor) {
      // Instructor profile not found, return empty array
      console.log("No instructor found for user:", req.user._id);
      return res.json([]);
    }

    const mongoose = require("mongoose");
    const allCarIds = [];

    // Add assigned school cars
    if (instructor.assignedCarIds && instructor.assignedCarIds.length > 0) {
      const assignedIds = instructor.assignedCarIds
        .map((id) => {
          try {
            if (id instanceof mongoose.Types.ObjectId) {
              return id;
            }
            if (typeof id === "string") {
              if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
                return new mongoose.Types.ObjectId(id);
              }
              return null;
            }
            if (typeof id === "object" && id !== null && id._id) {
              const idValue =
                id._id instanceof mongoose.Types.ObjectId
                  ? id._id
                  : mongoose.Types.ObjectId.isValid(id._id) &&
                    id._id.length === 24
                  ? new mongoose.Types.ObjectId(id._id)
                  : null;
              return idValue;
            }
            return null;
          } catch (err) {
            console.error("Error converting car ID:", id, err);
            return null;
          }
        })
        .filter((id) => id !== null);
      allCarIds.push(...assignedIds);
    }

    // Add personal cars
    if (instructor.personalCarIds && instructor.personalCarIds.length > 0) {
      const personalIds = instructor.personalCarIds
        .map((id) => {
          try {
            if (id instanceof mongoose.Types.ObjectId) {
              return id;
            }
            if (typeof id === "string") {
              if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
                return new mongoose.Types.ObjectId(id);
              }
              return null;
            }
            if (typeof id === "object" && id !== null && id._id) {
              const idValue =
                id._id instanceof mongoose.Types.ObjectId
                  ? id._id
                  : mongoose.Types.ObjectId.isValid(id._id) &&
                    id._id.length === 24
                  ? new mongoose.Types.ObjectId(id._id)
                  : null;
              return idValue;
            }
            return null;
          } catch (err) {
            console.error("Error converting personal car ID:", id, err);
            return null;
          }
        })
        .filter((id) => id !== null);
      allCarIds.push(...personalIds);
    }

    // Also get personal cars directly linked via instructorId
    const personalCarsByLink = await Car.find({ instructorId: instructor._id });
    const personalCarIdsByLink = personalCarsByLink
      .map((car) => car._id)
      .filter((id) => !allCarIds.some((existingId) => existingId.equals(id)));
    allCarIds.push(...personalCarIdsByLink);

    if (allCarIds.length === 0) {
      console.log("No cars found for instructor:", instructor._id);
      return res.json([]);
    }

    const cars = await Car.find({ _id: { $in: allCarIds } }).sort({
      createdAt: -1,
    });
    console.log("Found cars:", cars.length, "for instructor:", instructor._id);
    res.json(cars);
  } catch (err) {
    console.error("Error in getMyCars:", err);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    res.json(car);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      model,
      yearOfManufacture,
      chassisNumber,
      transmission,
      fuelType,
      licensePlate,
      ownership,
      registrationExpiry,
      lastInspection,
      nextInspection,
      status = "active",
    } = req.body;

    // Validate required fields
    if (
      !model ||
      !yearOfManufacture ||
      !chassisNumber ||
      !transmission ||
      !fuelType ||
      !licensePlate ||
      !ownership ||
      !registrationExpiry ||
      !lastInspection ||
      !nextInspection
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Validate transmission type
    if (!["manual", "automatic"].includes(transmission)) {
      return res
        .status(400)
        .json({ message: 'Transmission must be "manual" or "automatic"' });
    }

    // Validate fuel type
    if (!["petrol", "diesel", "electric", "hybrid"].includes(fuelType)) {
      return res.status(400).json({ message: "Invalid fuel type" });
    }

    // Validate ownership type
    if (!["owned", "leased", "rented"].includes(ownership)) {
      return res.status(400).json({ message: "Invalid ownership type" });
    }

    // Validate status
    if (status && !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Status must be "active" or "inactive"' });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (yearOfManufacture < 1900 || yearOfManufacture > currentYear + 1) {
      return res.status(400).json({ message: "Invalid year of manufacture" });
    }

    // Validate dates
    const regExpiry = new Date(registrationExpiry);
    const lastInsp = new Date(lastInspection);
    const nextInsp = new Date(nextInspection);

    if (isNaN(regExpiry.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid registration expiry date" });
    }
    if (isNaN(lastInsp.getTime())) {
      return res.status(400).json({ message: "Invalid last inspection date" });
    }
    if (isNaN(nextInsp.getTime())) {
      return res.status(400).json({ message: "Invalid next inspection date" });
    }

    // Normalize license plate (uppercase, remove spaces)
    const normalizedLicensePlate = licensePlate
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    // Create car
    const car = await Car.create({
      model: model.trim(),
      yearOfManufacture,
      chassisNumber: chassisNumber.trim(),
      transmission,
      fuelType,
      licensePlate: normalizedLicensePlate,
      ownership,
      registrationExpiry: regExpiry,
      lastInspection: lastInsp,
      nextInspection: nextInsp,
      status,
    });

    res.status(201).json(car);
  } catch (err) {
    console.error("Error creating car:", err);
    if (err.code === 11000) {
      // Check which field caused the duplicate
      if (err.keyPattern?.chassisNumber) {
        return res
          .status(400)
          .json({ message: "Chassis number already in use" });
      }
      if (err.keyPattern?.licensePlate) {
        return res
          .status(400)
          .json({ message: "License plate already in use" });
      }
      return res
        .status(400)
        .json({ message: "Chassis number or license plate already in use" });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const {
      model,
      yearOfManufacture,
      chassisNumber,
      transmission,
      fuelType,
      licensePlate,
      ownership,
      registrationExpiry,
      lastInspection,
      nextInspection,
      totalHours,
      status,
    } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Update fields if provided
    if (model !== undefined) car.model = model.trim();
    if (yearOfManufacture !== undefined) {
      const currentYear = new Date().getFullYear();
      if (yearOfManufacture < 1900 || yearOfManufacture > currentYear + 1) {
        return res.status(400).json({ message: "Invalid year of manufacture" });
      }
      car.yearOfManufacture = yearOfManufacture;
    }
    if (chassisNumber !== undefined) car.chassisNumber = chassisNumber.trim();
    if (transmission !== undefined) {
      if (!["manual", "automatic"].includes(transmission)) {
        return res
          .status(400)
          .json({ message: 'Transmission must be "manual" or "automatic"' });
      }
      car.transmission = transmission;
    }
    if (fuelType !== undefined) {
      if (!["petrol", "diesel", "electric", "hybrid"].includes(fuelType)) {
        return res.status(400).json({ message: "Invalid fuel type" });
      }
      car.fuelType = fuelType;
    }
    if (licensePlate !== undefined) {
      car.licensePlate = licensePlate.trim().toUpperCase().replace(/\s+/g, "");
    }
    if (ownership !== undefined) {
      if (!["owned", "leased", "rented"].includes(ownership)) {
        return res.status(400).json({ message: "Invalid ownership type" });
      }
      car.ownership = ownership;
    }
    if (registrationExpiry !== undefined) {
      const date = new Date(registrationExpiry);
      if (isNaN(date.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid registration expiry date" });
      }
      car.registrationExpiry = date;
    }
    if (lastInspection !== undefined) {
      const date = new Date(lastInspection);
      if (isNaN(date.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid last inspection date" });
      }
      car.lastInspection = date;
    }
    if (nextInspection !== undefined) {
      const date = new Date(nextInspection);
      if (isNaN(date.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid next inspection date" });
      }
      car.nextInspection = date;
    }
    if (totalHours !== undefined) {
      if (totalHours < 0) {
        return res
          .status(400)
          .json({ message: "Total hours cannot be negative" });
      }
      car.totalHours = totalHours;
    }
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res
          .status(400)
          .json({ message: 'Status must be "active" or "inactive"' });
      }
      car.status = status;
    }

    await car.save();
    res.json(car);
  } catch (err) {
    console.error("Error updating car:", err);
    if (err.code === 11000) {
      if (err.keyPattern?.chassisNumber) {
        return res
          .status(400)
          .json({ message: "Chassis number already in use" });
      }
      if (err.keyPattern?.licensePlate) {
        return res
          .status(400)
          .json({ message: "License plate already in use" });
      }
      return res
        .status(400)
        .json({ message: "Chassis number or license plate already in use" });
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: "Car deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getMyCars,
};
