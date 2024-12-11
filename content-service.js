const fs = require("fs"); // File system module
const { parse } = require("path"); // Path module

// using pool function from pg library to connect with postgresql DB
const { pool } = require("pg");

// Create a pool object to connect to the database
const pool = new pool({
  connectionString:
    "postgresql://neondb_owner:2PZkNQ8HXJCa@ep-rapid-fire-a51ospt2-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

// Function define to query DB to get articles
module.exports.getAllArticles = () => {
  return pool
    .query("SELECT * FROM articles")
    .then((res) => res.row)
    .catch((err) => Promise.reject(err || "Result not found in Database"));
};

// Function define to query DB to get categories
module.exports.getCategories = () => {
  return pool
    .query("SELECT * FROM categories")
    .then((res) => res.row)
    .catch((err) => Promise.reject(err || "Result not found in Database"));
};

// Function to get category name by ID
module.exports.getCategoryName = (categoryId) => {
  return pool
    .query(`SELECT name FROM categories WHERE id ${categoryId}`)
    .then((res) => res.row)
    .catch((err) =>
      Promise.reject(
        err || `Result not found in Database for categoryId: ${categoryId}`
      )
    );

  // const category = categories.find((cat) => cat.Id === categoryId);
  // return category ? category.name : "Unknown";
};
// Add new Article to the database
module.exports.addArticle = (articleData) => {
  // Step 0: Data validation to check we have all parameters
  if (
    !articleData.title ||
    !articleData.articleDate ||
    !articleData.category ||
    !articleData.content ||
    !articleData.published
  ) {
    return Promise.reject("Missing required fields");
  }

  // step 1: Create query
  const query = `INSERT INTO articles (title, articleDate, category, content, published) VALUES ($1, $2, $3, $4, $5) RETURNING *`;

  // Step 2: Create value
  const values = [
    articleData.title,
    articleData.articleDate,
    articleData.category,
    articleData.content,
    articleData.published,
  ];

  //Step 3: Execute query

  return pool
    .query(query, values)
    .then((res) => res.rows[0])
    .catch((err) =>
      Promise.reject(
        err || "Error while inserting into database. Contact administration"
      )
    );

  // return new Promise((resolve, reject) => {
  //   articleData.published = articleData.published ? true : false;
  //   articleData.Id = articles.length + 1; // Set ID to the current length + 1
  //   articles.push(articleData);
  //   resolve(articleData);
  // });
};

// Function to get articles by category and include the category name
function getArticlesByCategory(categoryId) {
  return pool
    .query(`SELECT * FROM articles WHERE category = $1`, [categoryId])
    .then((res) => res.rows)
    .catch((err) =>
      Promise.reject(
        err || `Result not found in Database for categoryId: ${categoryId}`
      )
    );
  // return new Promise((resolve, reject) => {

  //   const filteredArticles = articles.filter(
  //     (article) => article.category === parseInt(categoryId)
  //   );
  //   if (filteredArticles.length > 0) {
  //     // Add category name to each article
  //     const articlesWithCategoryName = filteredArticles.map((article) => ({
  //       ...article,
  //       categoryName: getCategoryName(article.category), // Add category name
  //     }));
  //     resolve(articlesWithCategoryName);
  //   } else {
  //     reject("No results found");
  //   }
  // });
}

// Function to get articles by minimum date and add category name
module.exports.getArticlesByMinDate = (minDateStr) => {
  return pool
    .query(`SELECT * FROM articles WHERE articleDate >= $1`, [minDateStr])
    .then((res) => res.rows)
    .catch((err) =>
      Promise.reject(
        err || `Result not found in Database for minDate: ${minDateStr}`
      )
    );

  // return new Promise((resolve, reject) => {
  //   const minDate = new Date(minDateStr); // Convert the string to a Date object
  //   const filteredArticles = articles.filter(
  //     (article) => new Date(article.articleDate) >= minDate
  //   );

  //   if (filteredArticles.length > 0) {
  //     // Add category name to each filtered article
  //     const articlesWithCategoryName = filteredArticles.map((article) => ({
  //       ...article,
  //       categoryName: getCategoryName(article.category), // Add category name
  //     }));
  //     resolve(articlesWithCategoryName);
  //   } else {
  //     reject("No results found");
  //   }
  // });
};

// Function to get article by ID from database

module.exports.getArticleById = (Id) => {
  return pool
    .query(`SELECT * FROM articles WHERE id ${Id}`)
    .then((res) => res.rows[0])
    .catch((err) =>
      Promise.reject(err || `The id ${Id} is not found in the database`)
    );
  // return new Promise((resolve, reject) => {
  //   const foundArticle = articles.find((article) => article.Id == parseInt(Id));
  //   if (foundArticle) resolve(foundArticle);
  //   else reject("no result returned");
  // });
};

// Function get only published articles
module.exports.getPublishedArticles = () => {
  return pool
    .query(`SELECT * FROM articles WHERE published = true`)
    .then((res) => res.rows)
    .catch((err) => Promise.reject(err || "No published articles found"));
  //return Promise.resolve(articles.filter((article) => article.published)); // Return only articles with `published: true`
};

module.exports.pool = pool;
