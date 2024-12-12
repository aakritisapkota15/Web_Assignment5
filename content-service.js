const fs = require("fs"); // File system module
const { parse } = require("path"); // Path module

// using pool function from pg library to connect with postgresql DB
const { Pool } = require("pg");

// Create a pool object to connect to the database
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:2PZkNQ8HXJCa@ep-rapid-fire-a51ospt2-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

// Initialize the content service
module.exports.initialize = async function () {
  try {
    // Test the connection to the database
    const client = await pool.connect();
    console.log("Database connection successful");
    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error("Failed to connect to the database:", err);
    throw err;
  }
};

// Function define to query DB to get articles
module.exports.getAllArticles = () => {
  return pool
    .query("SELECT * FROM articles")
    .then((res) => {
      const articleItems = res.rows;

      // Map each articles
      const articlesPromises = articleItems.map((article) => {
        //console.log(article.category);
        return pool
          .query("SELECT name FROM categories WHERE id = $1", [
            article.category,
          ])
          .then((catResult) => {
            //console.log("Category result", catResult);
            article.categoryName = catResult.rows[0].name;
            return article;
          })
          .catch((err) =>
            Promise.reject(err || "Result not found in Database")
          );
      });
      // wait for all maped promises to fullfilled becasue map is sync it will take promises and move to next execution
      return Promise.all(articlesPromises);
    })
    .catch((err) => Promise.reject(err || "Result not found in Database"));
};

// module.exports.getAllArticles = async function () {
//   const result = await pool.query(
//     "SELECT * FROM articles ORDER BY articledate DESC"
//   );
//   return result.rows;
// };

// Function define to query DB to get categories
module.exports.getCategories = () => {
  return pool
    .query("SELECT * FROM categories")
    .then((res) => res.rows)
    .catch((err) => Promise.reject(err || "Result not found in Database"));
};

// Function to get category name by ID
module.exports.getCategoryName = (categoryId) => {
  return pool
    .query(`SELECT name FROM categories WHERE id ${categoryId}`)
    .then((res) => res.rows)
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

module.exports.updateArticle = (articleId, articleData) => {
  // Step 0: Data validation to check we have all parameters
  if (!articleData.title || !articleData.category || !articleData.content) {
    return Promise.reject("Missing required fields");
  }

  // STEP O: FIND THE CATEGORY id

  // const categoryQuery = `SELECT id FROM category WHERE name = $1`;
  // const categoryValues = [articleData.category];

  // return pool
  //   .query(categoryQuery, categoryValues)
  //   .then((categoryData) => {
  //     articleData.category = categoryData.rows[0].id;
  //   })
  //   .catch((err) => Promise.reject(err || "Error while fetching category"));

  // Step 1: Create query
  const query = `UPDATE articles SET title = $1, articleDate = $2, category = $3, content = $4, author = $5, published = $6 WHERE id = $7 RETURNING *`;

  // Step 2: Create values
  const values = [
    articleData.title,
    articleData.articleDate,
    articleData.category,
    articleData.content,
    articleData.author,
    articleData.published || false,
    articleId,
  ];

  // Step 3: Execute query
  return pool
    .query(query, values)
    .then((res) => res.rows[0])
    .catch((err) =>
      Promise.reject(
        err || "Error while updating into database. Contact administration"
      )
    );

  // return new Promise((resolve, reject) => {
  //   articleData.published = articleData.published ? true : false;
  //   const index = articles.findIndex((article) => article.Id === articleId);
  //   if (index >= 0) {
  //     articles[index] = { ...articleData, Id: articleId };
  //     resolve(articles[index]);
  //   } else {
  //     reject("Article not found");
  //   }
  // });
};

// Function to get articles by category and include the category name
module.exports.getArticlesByCategory = (categoryId) => {
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
};

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
    .query("SELECT * FROM articles WHERE id = $1", [Id])
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

// Fetch article by ID
// module.exports.getArticleById = async function (articleId) {
//   const result = await pool.query("SELECT * FROM articles WHERE id = $1", [
//     articleId,
//   ]);
//   return result.rows.length > 0
//     ? result.rows[0]
//     : Promise.reject("Article not found");
// };

// Function get only published articles
module.exports.getPublishedArticles = () => {
  return pool
    .query(`SELECT * FROM articles WHERE published = true`)
    .then((res) => res.rows)
    .catch((err) => Promise.reject(err || "No published articles found"));
  //return Promise.resolve(articles.filter((article) => article.published)); // Return only articles with `published: true`
};

module.exports.deleteArticle = (articleId) => {
  return pool
    .query("DELETE FROM articles WHERE id = $1", [articleId])
    .then((res) => {
      return res.rowCount > 0 ? "Article deleted" : "Article not found";
    })
    .catch((err) => Promise.reject(err || "Error while deleting article"));
};
