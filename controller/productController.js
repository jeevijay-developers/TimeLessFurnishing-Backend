const Product = require("../models/Product");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const { languageCodes } = require("../utils/data");

const addProduct = async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      // productId: cname + (count + 1),
      productId: req.body.productId
        ? req.body.productId
        : new mongoose.Types.ObjectId(),
      // old code
      //  mongoose.Types.ObjectId(),
    });
    //  console.log('product data',req.body)

    await newProduct.save();
    res.send(newProduct);
  } catch (err) {
    console.log("error in add product", err),
      res.status(500).send({
        message: err.message,
      });
  }
};

const addAllProducts = async (req, res) => {
  try {
    // console.log('product data',req.body)
    await Product.deleteMany();
    await Product.insertMany(req.body);
    res.status(200).send({
      message: "Product Added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getShowingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "show" }).sort({ _id: -1 });
    res.send(products);
    // console.log("products", products);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  const { title, category, price, page, limit, sku } = req.query;

  // console.log("getAllProducts");

  let queryObject = {};
  let sortObject = {};
  if (title) {
    const titleQueries = languageCodes.map((lang) => ({
      [`title.${lang}`]: { $regex: `${title}`, $options: "i" },
    }));
    queryObject.$or = titleQueries;
  }
  if (sku) {
    queryObject.sku = sku;
  }

  if (price === "low") {
    sortObject = {
      "prices.originalPrice": 1,
    };
  } else if (price === "high") {
    sortObject = {
      "prices.originalPrice": -1,
    };
  } else if (price === "published") {
    queryObject.status = "show";
  } else if (price === "unPublished") {
    queryObject.status = "hide";
  } else if (price === "status-selling") {
    queryObject.stock = { $gt: 0 };
  } else if (price === "status-out-of-stock") {
    queryObject.stock = { $lt: 1 };
  } else if (price === "date-added-asc") {
    sortObject.createdAt = 1;
  } else if (price === "date-added-desc") {
    sortObject.createdAt = -1;
  } else if (price === "date-updated-asc") {
    sortObject.updatedAt = 1;
  } else if (price === "date-updated-desc") {
    sortObject.updatedAt = -1;
  } else {
    sortObject = { _id: -1 };
  }

  // console.log('sortObject', sortObject);

  if (category) {
    queryObject.categories = category;
  }

  const pages = Number(page);
  const limits = Number(limit);
  const skip = (pages - 1) * limits;

  try {
    const totalDoc = await Product.countDocuments(queryObject);

    const products = await Product.find(queryObject)
      .populate({ path: "category", select: "_id name" })
      .populate({ path: "categories", select: "_id name" })
      .sort(sortObject)
      .skip(skip)
      .limit(limits);

    res.send({
      products,
      totalDoc,
      limits,
      pages,
    });
  } catch (err) {
    // console.log("error", err);
    res.status(500).send({
      message: err.message,
    });
  }
};

const getProductBySlug = async (req, res) => {
  // console.log("slug", req.params.slug);
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: `Slug problem, ${err.message}`,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({ path: "category", select: "_id, name" })
      .populate({ path: "categories", select: "_id name" });

    res.send(product);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateProduct = async (req, res) => {
  // console.log('update product')
  // console.log('variant',req.body.variants)
  try {
    const product = await Product.findById(req.params.id);
    // console.log("product", product);

    if (product) {
      product.title = { ...product.title, ...req.body.title };
      product.description = {
        ...product.description,
        ...req.body.description,
      };

      product.productId = req.body.productId;
      product.sku = req.body.sku;
      product.barcode = req.body.barcode;
      product.slug = req.body.slug;
      product.categories = req.body.categories;
      product.category = req.body.category;
      product.show = req.body.show;
      product.isCombination = req.body.isCombination;
      product.variants = req.body.variants;
      product.stock = req.body.stock;
      product.prices = req.body.prices;
      product.image = req.body.image;
      product.tag = req.body.tag;
      product.commission = req.body.commission;

      await product.save();
      res.send({ data: product, message: "Product updated successfully!" });
    } else {
      res.status(404).send({
        message: "Product Not Found!",
      });
    }
  } catch (err) {
    res.status(404).send(err.message);
    console.log("err in update:", err);
  }
};

const updateManyProducts = async (req, res) => {
  try {
    const updatedData = {};
    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] !== "[]" &&
        Object.entries(req.body[key]).length > 0 &&
        req.body[key] !== req.body.ids
      ) {
        // console.log('req.body[key]', typeof req.body[key]);
        updatedData[key] = req.body[key];
      }
    }

    // console.log("updated data", updatedData);

    await Product.updateMany(
      { _id: { $in: req.body.ids } },
      {
        $set: updatedData,
      },
      {
        multi: true,
      }
    );
    res.send({
      message: "Products update successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const newStatus = req.body.status;
    await Product.updateOne(
      { _id: req.params.id },
      { $set: { status: newStatus } }
    );
    res.status(200).send({
      message: `Product ${newStatus} Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.deleteOne({ _id: req.params.id });
    res.status(200).send({
      message: "Product Deleted Successfully!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};
// old code 
// const getShowingStoreProducts = async (req, res) => {
//   // console.log("req.body", req);
//   try {
//     const queryObject = { status: "show" };

//     // console.log("getShowingStoreProducts");

//     const { category, title, slug, _id } = req.query;
//     console.log(" _id:", _id);
//     console.log("slug:", slug);
//     console.log("category:", category);
//     // console.log("title", title);

//     // console.log("query", req);

//     // old code of category
//     // if (category) {
//     //   queryObject.categories = {
//     //     $in: [category],
//     //   };
//     // }

    
//     if (category) {
//       // 1. Get subcategories
//       const allCategories = await Category.find({
//         $or: [{ _id: category }, { parentId: category }],
//       });

//       // 2. Extract all IDs (parent + subcategories)
//       const categoryIds = allCategories.map((cat) => cat._id);

//       // 3. Filter products with any of those categories
//       queryObject.categories = { $in: categoryIds };
//     }

//     if (title) {
//       const titleQueries = languageCodes.map((lang) => ({
//         [`title.${lang}`]: { $regex: `${title}`, $options: "i" },
//       }));

//       queryObject.$or = titleQueries;
//     }
//     if (slug) {
//       queryObject.slug = { $regex: slug, $options: "i" };
//     }

//     let products = [];
//     let popularProducts = [];
//     let discountedProducts = [];
//     let relatedProducts = [];

//     if (slug) {
//       products = await Product.find(queryObject)
//         .populate({ path: "category", select: "name _id" })
//         .sort({ _id: -1 })
//         .limit(100);
//       relatedProducts = await Product.find({
//         category: products[0]?.category,
//       }).populate({ path: "category", select: "_id name" });
//     } else if (title || category) {
//       products = await Product.find(queryObject)
//         .populate({ path: "category", select: "name _id" })
//         .sort({ _id: -1 })
//         .limit(100);
//     } else {
//       popularProducts = await Product.find({ status: "show" })
//         .populate({ path: "category", select: "name _id" })
//         .sort({ sales: -1 })
//         .limit(20);

//       discountedProducts = await Product.find({
//         status: "show", // Ensure status "show" for discounted products
//         $or: [
//           {
//             $and: [
//               { isCombination: true },
//               {
//                 variants: {
//                   $elemMatch: {
//                     discount: { $gt: "0.00" },
//                   },
//                 },
//               },
//             ],
//           },
//           {
//             $and: [
//               { isCombination: false },
//               {
//                 $expr: {
//                   $gt: [
//                     { $toDouble: "$prices.discount" }, // Convert the discount field to a double
//                     0,
//                   ],
//                 },
//               },
//             ],
//           },
//         ],
//       })
//         .populate({ path: "category", select: "name _id" })
//         .sort({ _id: -1 })
//         .limit(20);
//     }

//     res.send({
//       products,
//       popularProducts,
//       relatedProducts,
//       discountedProducts,
//     });
//   } catch (err) {
//     res.status(500).send({
//       message: err.message,
//     });
//   }
// };

const getAllCategoryIds = async (parentId) => {
  const categories = await Category.find({ parentId });
  const ids = categories.map((cat) => cat._id);

  for (const cat of categories) {
    const childIds = await getAllCategoryIds(cat._id);
    ids.push(...childIds);
  }

  return ids;
};

const getShowingStoreProducts = async (req, res) => {
  try {
    const queryObject = { status: "show" };
    const { category, title, slug } = req.query;

    if (category) {
      // Get the main category + all nested child category IDs
      const categoryIds = [category, ...(await getAllCategoryIds(category))];
      queryObject.categories = { $in: categoryIds };
    }

    if (title) {
      const titleQueries = languageCodes.map((lang) => ({
        [`title.${lang}`]: { $regex: `${title}`, $options: "i" },
      }));
      queryObject.$or = titleQueries;
    }

    if (slug) {
      queryObject.slug = { $regex: slug, $options: "i" };
    }

    let products = [];
    let popularProducts = [];
    let discountedProducts = [];
    let relatedProducts = [];

    if (slug) {
      products = await Product.find(queryObject)
        .populate({ path: "category", select: "name _id" })
        .sort({ _id: -1 })
        .limit(100);
      relatedProducts = await Product.find({
        category: products[0]?.category,
      }).populate({ path: "category", select: "_id name" });
    } else if (title || category) {
      products = await Product.find(queryObject)
        .populate({ path: "category", select: "name _id" })
        .sort({ _id: -1 })
        .limit(100);
    } else {
      // default popular/discounted
      popularProducts = await Product.find({ status: "show" })
        .populate({ path: "category", select: "name _id" })
        .sort({ sales: -1 })
        .limit(20);

      discountedProducts = await Product.find({
        status: "show",
        $or: [
          {
            $and: [
              { isCombination: true },
              {
                variants: {
                  $elemMatch: {
                    discount: { $gt: "0.00" },
                  },
                },
              },
            ],
          },
          {
            $and: [
              { isCombination: false },
              {
                $expr: {
                  $gt: [{ $toDouble: "$prices.discount" }, 0],
                },
              },
            ],
          },
        ],
      })
        .populate({ path: "category", select: "name _id" })
        .sort({ _id: -1 })
        .limit(20);
    }

    res.send({
      products,
      popularProducts,
      relatedProducts,
      discountedProducts,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const deleteManyProducts = async (req, res) => {
  try {
    const cname = req.cname;
    // console.log("deleteMany", cname, req.body.ids);

    await Product.deleteMany({ _id: req.body.ids });

    res.send({
      message: `Products Delete Successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

module.exports = {
  addProduct,
  addAllProducts,
  getAllProducts,
  getShowingProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  updateManyProducts,
  updateStatus,
  deleteProduct,
  deleteManyProducts,
  getShowingStoreProducts,
};
