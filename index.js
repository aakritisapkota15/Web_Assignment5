// Import the Express library
const express = require("express");

const multer = require("multer");

const cloudinary = require("cloudinary").v2;

const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: "dexmgropy",
  api_key: "269573191974962",
  api_secret: "Ef-1jBn7kdls2-dfzmjPPFiCyhU",
  secure: true,
});

const upload = multer();

// Import the 'path' module to handle file paths
const path = require("path");

// Import the custom data handling module, assumed to manage categories and articles
const contentService = require("./content-service");

// Create an Express application instance
const app = express();

// Set the view engine to EJS
app.set("view engine", "ejs");

// Set the views folder for EJS templates
app.set("views", path.join(__dirname, "views"));

// Set the HTTP port to an environment variable or default to 3838
const HTTP_PORT = process.env.PORT || 3838;

// Serve static files from the "public" directory (e.g., CSS, JS files, images)
app.use(express.static("public"));

// Route for the root path, redirecting to the "/about" page
app.get("/", (req, res) => {
  res.redirect("/about");
});

// Route for the "/about" page, serving the "about.html" file
app.get("/about", (req, res) => {
  res.render("about");
});

// Route for the "/categories" endpoint, returning categories in JSON format
app.get("/categories", (req, res) => {
  contentService.getCategories().then((data) => {
    res.render("categories", { categories: data });
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

app.listen(HTTP_PORT, () => {
  console.log(`Server running on http://localhost:${HTTP_PORT}`);
});

// Export the Express app instance (useful for testing or external usage)
module.exports = app;
