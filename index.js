// Import the Express library
const express = require("express");

const multer = require("multer");

const cloudinary = require("cloudinary").v2;

const streamifier = require("streamifier");

require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const upload = multer();

// Import the 'path' module to handle file paths
const path = require("path");

// Data handeling functions
const contentService = require("./content-service");

// Create an Express application instance
const app = express();

// handle form data
app.use(express.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set("view engine", "ejs");

// Set the views folder for EJS templates
app.set("views", path.join(__dirname, "views"));

const HTTP_PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// redirect to about page
app.get("/", (req, res) => {
  res.redirect("/about");
});

// Route for about
app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/categories", (req, res) => {
  contentService
    .getCategories()
    .then((data) => {
      console.log(data);
      //res.status(200).json(data);
      res.render("categories", { categories: data });
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({ message: err });
    });
});

app.get("/articles", (req, res, next) => {
  if (req.query.category) {
    // Handle filtering by category
    contentService
      .getArticlesByCategory(req.query.category)
      .then((articles) => {
        res.render("articles", { articles: articles });
      })
      .catch((err) => {
        res.status(404).json({ message: err });
      });
  } else if (req.query.minDate) {
    // Handle filtering by minDate
    contentService
      .getArticlesByMinDate(req.query.minDate)
      .then((articles) => {
        res.render("articles", { articles: articles });
      })
      .catch((err) => {
        res.status(404).json({ message: err });
      });
  } else {
    // If no query parameters, fetch all articles
    contentService
      .getAllArticles()
      .then((articles) => {
        //res.json("You have reached the articles endpoint");
        //res.json(articles);
        res.render("articles", { articles: articles });
      })
      .catch((err) => {
        res.status(404).json({ message: err });
      });
  }
});

app.get("/article/:Id", (req, res) => {
  contentService
    .getArticleById(req.params.Id)
    .then((article) => {
      if (article.published === true)
        res.render("article", { article: article });
      else res.status(404).json({ message: "404: Article Not Found" });
    })
    .catch((err) => {
      res.status(404).json({ message: err });
    });
});

// Adding route to add articles
app.get("/articles/edit/:id", (req, res) => {
  const articleId = req.params.id;
  //console.log("I am reached");
  // Step 1: Get article by ID
  contentService
    .getArticleById(articleId)
    .then((article) => {
      //return res.status(200).json(article);
      //step 2: get Categories
      contentService
        .getCategories()
        .then((categories) => {
          //return res.status(200).json(article);
          //console.log(categories);
          return res.render("editArticle", { article, categories });
        })
        .catch((err) => {
          res.status(404).json({ message: err });
        });
    })
    .catch((err) => {
      res.status(404).json({ message: err });
    });
});

app.post("/articles/edit/:id", (req, res) => {
  const articleId = req.params.id;
  // Build the article object

  console.log(req.body.title);

  const articleData = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    published: req.body.published,
    category: req.body.category,
    featureImage: req.body.featureImage,
  };

  console.log("Article Data:", articleData);
  // Call content-service to update the article
  contentService
    .updateArticle(articleId, articleData)
    .then(() => res.redirect("/articles")) // Redirect to articles page on success
    .catch((err) =>
      res.status(500).json({ message: "Failed to update article", error: err })
    );
});

app.get("/articles/add", (req, res) => {
  contentService
    .getCategories()
    .then((data) => {
      res.render("addArticle", { categories: data });
    })
    .catch((err) => {
      res.status(404).json({ message: err });
    });
});

// due to html form not supporting put and delete method we need to use post method
// Overriding the method in the form
app.post("/articles/delete/:id", (req, res) => {
  contentService
    .deleteArticle(req.params.id)
    .then(() => res.redirect("/articles"))
    .catch((err) =>
      res.status(500).json({ message: "Failed to delete article", error: err })
    );
});

app.post("/articles/add", upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          { folder: "articles" }, // Optional: Store in a specific folder
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function uploadToCloudinary(req) {
      let result = await streamUpload(req);
      return result.url; // Return the uploaded image URL
    }

    uploadToCloudinary(req)
      .then((imageUrl) => {
        processArticle(imageUrl);
      })
      .catch((err) => {
        res.status(500).json({ message: "Image upload failed", error: err });
      });
  } else {
    processArticle(""); // If no image uploaded, pass an empty string
  }

  function processArticle(imageUrl) {
    // Build the article object
    const articleData = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      category: parseInt(req.body.category),
      published: req.body.published === "on", // Checkbox value
      featureImage: imageUrl || "", // Use the uploaded image URL or empty string
      articleDate: new Date().toISOString(), // Current timestamp
    };

    console.log(req.body);

    // Call content-service to add the article
    console.log("Article Data:", articleData);
    contentService
      .addArticle(articleData)
      .then(() => res.redirect("/articles")) // Redirect to articles page on success
      .catch((err) =>
        res.status(500).json({ message: "Failed to add article", error: err })
      );
  }
});

// Initialize the data in the storeData module, then start the server
// contentService.initialize().then(() => {
//   app.listen(HTTP_PORT); // Start server and listen on specified port
//   console.log("server listening @ http://localhost:" + HTTP_PORT);
// });

contentService.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`Server running on http://localhost:${HTTP_PORT}`);
  });
});

// Export the Express app instance (useful for testing or external usage)
module.exports = app;
