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
            // Silently handle conversion errors
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
            // Silently handle conversion errors
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
      return res.json([]);
    }

    const cars = await Car.find({ _id: { $in: allCarIds } }).sort({
      createdAt: -1,
    });
    res.json(cars);
  } catch (err) {
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
      instructorId,
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
    if (!["owned", "leased", "rented", "instructor"].includes(ownership)) {
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

    // Validate instructorId if ownership is instructor
    if (ownership === "instructor") {
      if (!instructorId) {
        return res.status(400).json({ message: "Instructor ID is required when ownership is instructor" });
      }
      const Instructor = require("../models/Instructor");
      const instructor = await Instructor.findById(instructorId);
      if (!instructor) {
        return res.status(404).json({ message: "Instructor not found" });
      }
    }

    // Create car
    const car = await Car.create({
      model: model.trim(),
      yearOfManufacture,
      chassisNumber: chassisNumber.trim(),
      transmission,
      fuelType,
      licensePlate: normalizedLicensePlate,
      ownership,
      instructorId: ownership === "instructor" ? instructorId : null,
      registrationExpiry: regExpiry,
      lastInspection: lastInsp,
      nextInspection: nextInsp,
      status,
    });

    // If ownership is instructor, add car to instructor's assignedCarIds
    if (ownership === "instructor" && instructorId) {
      const Instructor = require("../models/Instructor");
      const instructor = await Instructor.findById(instructorId);
      if (instructor) {
        const carIdString = car._id.toString();
        if (!instructor.assignedCarIds.includes(carIdString)) {
          instructor.assignedCarIds.push(carIdString);
          await instructor.save();
        }
      }
    }

    res.status(201).json(car);
  } catch (err) {
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
      instructorId,
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
      if (!["owned", "leased", "rented", "instructor"].includes(ownership)) {
        return res.status(400).json({ message: "Invalid ownership type" });
      }
      car.ownership = ownership;
    }

    // Handle instructorId
    const Instructor = require("../models/Instructor");
    const oldInstructorId = car.instructorId ? car.instructorId.toString() : null;
    
    // Determine the final ownership value (use provided or keep existing)
    const finalOwnership = ownership !== undefined ? ownership : car.ownership;
    
    if (finalOwnership === "instructor") {
      if (instructorId !== undefined) {
        // InstructorId is being explicitly set
        if (!instructorId) {
          return res.status(400).json({ message: "Instructor ID is required when ownership is instructor" });
        }
        const instructor = await Instructor.findById(instructorId);
        if (!instructor) {
          return res.status(404).json({ message: "Instructor not found" });
        }
        car.instructorId = instructorId;
      } else {
        // InstructorId not provided in request
        if (ownership === "instructor" && !car.instructorId) {
          // If ownership is being changed to instructor but no instructorId provided and car doesn't have one
          return res.status(400).json({ message: "Instructor ID is required when ownership is instructor" });
        }
        // Otherwise, keep existing instructorId
      }
    } else {
      // If ownership is not instructor (or being changed from instructor), clear instructorId
      if (ownership !== undefined && ownership !== "instructor") {
        car.instructorId = null;
      }
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

    // Update instructor's assignedCarIds if instructorId changed
    const newInstructorId = car.instructorId ? car.instructorId.toString() : null;
    const carIdString = car._id.toString();

    // Remove from old instructor if changed
    if (oldInstructorId && oldInstructorId !== newInstructorId) {
      const oldInstructor = await Instructor.findById(oldInstructorId);
      if (oldInstructor) {
        oldInstructor.assignedCarIds = oldInstructor.assignedCarIds.filter(
          (id) => id.toString() !== carIdString
        );
        await oldInstructor.save();
      }
    }

    // Add to new instructor if ownership is instructor
    if (car.ownership === "instructor" && newInstructorId) {
      const newInstructor = await Instructor.findById(newInstructorId);
      if (newInstructor) {
        if (!newInstructor.assignedCarIds.includes(carIdString)) {
          newInstructor.assignedCarIds.push(carIdString);
          await newInstructor.save();
        }
      }
    } else if (oldInstructorId && car.ownership !== "instructor") {
      // Remove from instructor if ownership changed from instructor to something else
      const oldInstructor = await Instructor.findById(oldInstructorId);
      if (oldInstructor) {
        oldInstructor.assignedCarIds = oldInstructor.assignedCarIds.filter(
          (id) => id.toString() !== carIdString
        );
        await oldInstructor.save();
      }
    }

    res.json(car);
  } catch (err) {
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
