const Car = require("../models/Car");

const list = async (_req, res, next) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    next(err);
  }
};

// Get cars assigned to the logged-in instructor
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

    // Get cars assigned to this instructor
    if (!instructor.assignedCarIds || instructor.assignedCarIds.length === 0) {
      console.log("No assignedCarIds found for instructor:", instructor._id);
      return res.json([]);
    }

    console.log("Instructor assignedCarIds (raw):", instructor.assignedCarIds);

    // Convert string IDs to ObjectIds and find cars
    const mongoose = require("mongoose");
    const carIds = instructor.assignedCarIds
      .map((id) => {
        try {
          // Handle if id is already an ObjectId
          if (id instanceof mongoose.Types.ObjectId) {
            return id;
          }
          // Handle if id is a string
          if (typeof id === "string") {
            // Check if it's a valid ObjectId string (must be 24 hex characters)
            if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
              return new mongoose.Types.ObjectId(id);
            } else {
              console.log(
                "Invalid ObjectId string (skipping):",
                id,
                "- length:",
                id.length
              );
              return null;
            }
          }
          // Handle if id is an object with _id property
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
          console.log("Unexpected id format:", id, typeof id);
          return null;
        } catch (err) {
          console.error("Error converting car ID:", id, err);
          return null;
        }
      })
      .filter((id) => id !== null);

    console.log(
      "Converted carIds (valid ObjectIds):",
      carIds.map((id) => id.toString())
    );

    if (carIds.length === 0) {
      console.log("No valid car IDs after conversion - all IDs were invalid");
      return res.json([]);
    }

    const cars = await Car.find({ _id: { $in: carIds } }).sort({
      createdAt: -1,
    });
    console.log("Found cars:", cars.length, "for", carIds.length, "carIds");
    if (cars.length === 0) {
      console.log(
        "No cars found in database for these IDs:",
        carIds.map((id) => id.toString())
      );
    }
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
