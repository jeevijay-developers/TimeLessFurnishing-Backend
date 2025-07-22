require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const { signInToken, tokenForVerify } = require("../config/auth");
const { sendEmail } = require("../lib/email-sender/sender");
const {
  customerRegisterBody,
} = require("../lib/email-sender/templates/register");
const {
  forgetPasswordEmailBody,
} = require("../lib/email-sender/templates/forget-password");
const { sendVerificationCode } = require("../lib/phone-verification/sender");
const Telecaller = require("../models/Telecaller");
const Partner = require("../models/Partner");

const verifyEmailAddress = async (req, res) => {
  const phone = req.body.phone;
  const email = req.body.email;
  const existingCustomer = await Customer.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingCustomer) {
    return res
      .status(400)
      .json({ error: "Email or phone number already exists." });
  } else {
    const pwd = bcrypt.hashSync(req.body.password);

    const name = req.body.name;

    const newCustomer = new Customer({
      name,
      email,
      phone,
      password: pwd,
    });
    try {
      await newCustomer.save();
    } catch (err) {
      return res.status(500).send({
        message: err.message,
      });
    }

    res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
    });
  }
};
// const verifyEmailAddress = async (req, res) => {
//   const isAdded = await Customer.findOne({ email: req.body.email });
//   if (isAdded) {
//     return res.status(403).send({
//       message: "This Email already Added!",
//     });
//   } else {
//     console.log(req.body);

//     // const token = tokenForVerify(req.body);
//     // const option = {
//     //   name: req.body.name,
//     //   email: req.body.email,
//     //   token: token,
//     // };
//     // const body = {
//     //   from: process.env.EMAIL_USER,
//     //   // from: "info@demomailtrap.com",
//     //   to: `${req.body.email}`,
//     //   subject: "Email Activation",
//     //   subject: "Verify Your Email",
//     //   html: customerRegisterBody(option),
//     // };

//     // const message = "Please check your email to verify your account!";
//     // sendEmail(body, res, message);
//   }
// };

const verifyPhoneNumber = async (req, res) => {
  const phoneNumber = req.body.phone;

  // console.log("verifyPhoneNumber", phoneNumber);

  // Check if phone number is provided and is in the correct format
  if (!phoneNumber) {
    return res.status(400).send({
      message: "Phone number is required.",
    });
  }

  // Optional: Add phone number format validation here (if required)
  // const phoneRegex = /^[0-9]{10}$/; // Basic validation for 10-digit phone numbers
  // if (!phoneRegex.test(phoneNumber)) {
  //   return res.status(400).send({
  //     message: "Invalid phone number format. Please provide a valid number.",
  //   });
  // }

  try {
    // Check if the phone number is already associated with an existing customer
    const isAdded = await Customer.findOne({ phone: phoneNumber });

    if (isAdded) {
      return res.status(403).send({
        message: "This phone number is already added.",
      });
    }

    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Send verification code via SMS
    const sent = await sendVerificationCode(phoneNumber, verificationCode);

    if (!sent) {
      return res.status(500).send({
        message: "Failed to send verification code.",
      });
    }

    const message = "Please check your phone for the verification code!";
    return res.send({ message });
  } catch (err) {
    console.error("Error during phone verification:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const addCustomerViaTelecaller = async (req, res) => {
  const {
    name,
    image,
    address,
    country,
    city,
    shippingAddress,
    email,
    phone,
    password,
  } = req.body;

  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required." });
  }

  try {
    // Check if phone or email already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingCustomer) {
      return res
        .status(400)
        .json({ error: "Email or phone number already exists." });
    }

    // Create a new customer
    const pwd = bcrypt.hashSync(password);
    const newCustomer = new Customer({
      name,
      image,
      address,
      country,
      city,
      shippingAddress,
      email,
      phone: phone,
      password: pwd,
    });

    // Save the customer to the database
    // console.dir(newCustomer);
    await newCustomer.save();

    res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const loginTelecaller = async (req, res) => {
  try {
    const telecaller = await Telecaller.findOne({ email: req.body.email });
    console.log(telecaller);

    // Check if telecaller exists and role is 'Accepted'
    if (!telecaller) {
      return res.status(404).json({
        message: "User not found!",
        error: "No account associated with this email.",
        success: false,
      });
    }

    if (telecaller.status !== "Accepted") {
      return res.status(403).json({
        message: "Access denied!",
        error: "Your account role is not 'Accepted'. Please contact admin.",
        success: false,
      });
    }

    // Check password
    const CUSTOMER = await Customer.findOne({ email: req.body.email });
    // console.log(CUSTOMER);

    if (
      CUSTOMER.password &&
      bcrypt.compareSync(req.body.password, CUSTOMER.password)
    ) {
      const token = signInToken(telecaller);
      // delete telecaller.orders;
      return res.status(200).json({
        token,
        _id: telecaller._id,
        name: telecaller.name,
        email: telecaller.email,
        address: telecaller.address,
        phone: telecaller.mobile,
        image: telecaller.image,
        telecaller: telecaller,
        success: true,
      });
    } else {
      return res.status(401).json({
        message: "Invalid email or password!",
        error: "Invalid credentials.",
        success: false,
      });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      message: "Internal server error!",
      error: err.message,
      success: false,
    });
  }
};
const loginStorePartner = async (req, res) => {
  // console.log(req.body);

  try {
    const partner = await Partner.findOne({ email: req.body.email }).populate(
      "riders"
    );

    // Check if telecaller exists and role is 'Accepted'
    if (!partner) {
      return res.status(404).json({
        message: "User not found!",
        error: "No account associated with this email.",
        success: false,
      });
    }

    if (partner.status !== "Accepted") {
      return res.status(403).json({
        message: "Access denied!",
        error: "Your account role is not 'Accepted'. Please contact admin.",
        success: false,
      });
    }

    // Check password
    const CUSTOMER = await Customer.findOne({ email: req.body.email });
    // console.log(CUSTOMER);

    if (
      CUSTOMER.password &&
      bcrypt.compareSync(req.body.password, CUSTOMER.password)
    ) {
      const token = signInToken(partner);

      return res.status(200).json({
        token,
        _id: partner._id,
        partner: partner,
        name: partner.name,
        email: partner.email,
        address: partner.address,
        phone: partner.phone,
        image: partner.image,
        success: true,
      });
    } else {
      return res.status(401).json({
        message: "Invalid email or password!",
        error: "Invalid credentials.",
        success: false,
      });
    }
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      message: "Internal server error!",
      error: err.message,
      success: false,
    });
  }
};

const registerCustomer = async (req, res) => {
  const token = req.params.token;

  try {
    const { name, email, password } = jwt.decode(token);

    // Check if the user is already registered
    const isAdded = await Customer.findOne({ email });

    if (isAdded) {
      const token = signInToken(isAdded);
      return res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        password: password,
        message: "Email Already Verified!",
      });
    }

    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET_FOR_VERIFY,
        async (err, decoded) => {
          if (err) {
            return res.status(401).send({
              message: "Token Expired, Please try again!",
            });
          }

          // Create a new user only if not already registered
          const existingUser = await Customer.findOne({ email });
          console.log("existingUser");

          if (existingUser) {
            return res.status(400).send({ message: "User already exists!" });
          } else {
            const newUser = new Customer({
              name,
              email,
              password: bcrypt.hashSync(password),
            });

            await newUser.save();
            const token = signInToken(newUser);
            res.send({
              token,
              _id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              message: "Email Verified, Please Login Now!",
            });
          }
        }
      );
    }
  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).send({
      message: "Internal server error. Please try again later.",
    });
  }
};

const addAllCustomers = async (req, res) => {
  try {
    await Customer.deleteMany();
    await Customer.insertMany(req.body);
    res.send({
      message: "Added all users successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ email: req.body.email });

    // console.log("loginCustomer", req.body.password, "customer", customer);

    if (
      customer &&
      customer.password &&
      bcrypt.compareSync(req.body.password, customer.password)
    ) {
      const token = signInToken(customer);
      res.send({
        token,
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        phone: customer.phone,
        image: customer.image,
      });
    } else {
      res.status(401).send({
        message: "Invalid user or password!",
        error: "Invalid user or password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
      error: "Invalid user or password!",
    });
  }
};

const forgetPassword = async (req, res) => {
  const isAdded = await Customer.findOne({ email: req.body.email });
  if (!isAdded) {
    return res.status(404).send({
      message: "User Not found with this email!",
    });
  } else {
    const token = tokenForVerify(isAdded);
    const option = {
      name: isAdded.name,
      email: isAdded.email,
      token: token,
    };

    const body = {
      from: process.env.EMAIL_USER,
      to: `${req.body.email}`,
      subject: "Password Reset",
      html: forgetPasswordEmailBody(option),
    };

    const message = "Please check your email to reset password!";
    sendEmail(body, res, message);
  }
};

const resetPassword = async (req, res) => {
  const token = req.body.token;
  const { email } = jwt.decode(token);
  const customer = await Customer.findOne({ email: email });

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_FOR_VERIFY, (err, decoded) => {
      if (err) {
        return res.status(500).send({
          message: "Token expired, please try again!",
        });
      } else {
        customer.password = bcrypt.hashSync(req.body.newPassword);
        customer.save();
        res.send({
          message: "Your password change successful, you can login now!",
        });
      }
    });
  }
};

const changePassword = async (req, res) => {
  try {
    // console.log("changePassword", req.body);
    const customer = await Customer.findOne({ email: req.body.email });
    if (!customer.password) {
      return res.status(403).send({
        message:
          "For change password,You need to sign up with email & password!",
      });
    } else if (
      customer &&
      bcrypt.compareSync(req.body.currentPassword, customer.password)
    ) {
      customer.password = bcrypt.hashSync(req.body.newPassword);
      await customer.save();
      res.send({
        message: "Your password change successfully!",
      });
    } else {
      res.status(401).send({
        message: "Invalid email or current password!",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithProvider = async (req, res) => {
  try {
    // const { user } = jwt.decode(req.body.params);
    const user = jwt.decode(req.params.token);

    // console.log("user", user);
    const isAdded = await Customer.findOne({ email: user.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
      });
    } else {
      const newUser = new Customer({
        name: user.name,
        email: user.email,
        image: user.picture,
      });

      const signUpCustomer = await newUser.save();
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const signUpWithOauthProvider = async (req, res) => {
  try {
    // console.log("user", user);
    // console.log("signUpWithOauthProvider", req.body);
    const isAdded = await Customer.findOne({ email: req.body.email });
    if (isAdded) {
      const token = signInToken(isAdded);
      res.send({
        token,
        _id: isAdded._id,
        name: isAdded.name,
        email: isAdded.email,
        address: isAdded.address,
        phone: isAdded.phone,
        image: isAdded.image,
      });
    } else {
      const newUser = new Customer({
        name: req.body.name,
        email: req.body.email,
        image: req.body.image,
      });

      const signUpCustomer = await newUser.save();
      const token = signInToken(signUpCustomer);
      res.send({
        token,
        _id: signUpCustomer._id,
        name: signUpCustomer.name,
        email: signUpCustomer.email,
        image: signUpCustomer.image,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const users = await Customer.find({}).sort({ _id: -1 });
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    res.send(customer);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// Shipping address create or update

// old code 
// const addShippingAddress = async (req, res) => {
//   try {
//     const customerId = req.params.id;
//     const newShippingAddress = req.body;
//     console.log(newShippingAddress);
//     delete newShippingAddress.phone;
//     console.log(newShippingAddress);
//     // Find the customer by ID and update the shippingAddress field
//     const result = await Customer.updateOne(
//       { _id: customerId },
//       {
//         $set: {
//           shippingAddress: newShippingAddress,
//         },
//       },
//       { upsert: true } // Create a new document if no document matches the filter
//     );

//     if (result.nModified > 0 || result.upserted) {
//       return res.send({
//         message: "Shipping address added or updated successfully.",
//       });
//     } else {
//       return res.status(404).send({ message: "Customer not found." });
//     }
//   } catch (err) {
//     console.log(err);

//     res.status(500).send({
//       message: err.message,
//     });
//   }
// };

const addShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    const newShippingAddress = req.body;
    // console.log("newShippingAddress",newShippingAddress);
    // delete newShippingAddress.phone;
    // console.log(newShippingAddress);

    // Find the customer by ID and update the shippingAddress field
    const result = await Customer.updateOne(
      { _id: customerId },
      {
        $set: {
          shippingAddress: newShippingAddress,
        },
      },
      { upsert: true }
    );

    // Fixed: Use the correct properties for newer Mongoose versions
    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      return res.send({
        message: "Shipping address added or updated successfully.",
      });
    } else {
      return res.status(404).send({ message: "Customer not found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShippingAddress = async (req, res) => {
  try {
    const customerId = req.params.id;
    // const addressId = req.query.id;

    // console.log("getShippingAddress", customerId);
    // console.log("addressId", req.query);

    const customer = await Customer.findById(customerId);
    res.send({ shippingAddress: customer?.shippingAddress });

    // if (addressId) {
    //   // Find the specific address by its ID
    //   const address = customer.shippingAddress.find(
    //     (addr) => addr._id.toString() === addressId.toString()
    //   );

    //   if (!address) {
    //     return res.status(404).send({
    //       message: "Shipping address not found!",
    //     });
    //   }

    //   return res.send({ shippingAddress: address });
    // } else {
    //   res.send({ shippingAddress: customer?.shippingAddress });
    // }
  } catch (err) {
    // console.error("Error adding shipping address:", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateShippingAddress = async (req, res) => {
  try {
    const activeDB = req.activeDB;

    const Customer = activeDB.model("Customer", CustomerModel);
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.shippingAddress.push(req.body);

      await customer.save();
      res.send({ message: "Success" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteShippingAddress = async (req, res) => {
  try {
    const activeDB = req.activeDB;
    const { userId, shippingId } = req.params;

    const Customer = activeDB.model("Customer", CustomerModel);
    await Customer.updateOne(
      { _id: userId },
      {
        $pull: {
          shippingAddress: { _id: shippingId },
        },
      }
    );

    res.send({ message: "Shipping Address Deleted Successfully!" });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    // Validate the input
    const { name, email, address, phone, image } = req.body;

    // Find the customer by ID
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).send({
        message: "Customer not found!",
      });
    }

    // Check if the email already exists and does not belong to the current customer
    const existingCustomer = await Customer.findOne({ email });
    if (
      existingCustomer &&
      existingCustomer._id.toString() !== customer._id.toString()
    ) {
      return res.status(400).send({
        message: "Email already exists.",
      });
    }

    // Update customer details
    customer.name = name;
    customer.email = email;
    customer.address = address;
    customer.phone = phone;
    customer.image = image;

    // Save the updated customer
    const updatedUser = await customer.save();

    // Generate a new token
    const token = signInToken(updatedUser);

    // Send the updated customer data with the new token
    res.send({
      token,
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      address: updatedUser.address,
      phone: updatedUser.phone,
      image: updatedUser.image,
      message: "Customer updated successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteCustomer = (req, res) => {
  Customer.deleteOne({ _id: req.params.id })
    .then(() => {
      res.status(200).send({
        message: "User Deleted Successfully!",
      });
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message,
      });
    });
};

module.exports = {
  loginCustomer,
  verifyPhoneNumber,
  registerCustomer,
  addAllCustomers,
  signUpWithProvider,
  signUpWithOauthProvider,
  verifyEmailAddress,
  forgetPassword,
  changePassword,
  resetPassword,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addShippingAddress,
  getShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
  addCustomerViaTelecaller,
  loginTelecaller,
  loginStorePartner,
};
