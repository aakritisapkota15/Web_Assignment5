-- The data table and data are creating and inserted through neon native SQL Editor feature.


-- Creating the category table

CREATE TABLE categories (
  Id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Creating article TABLE

CREATE TABLE articles (
    Id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    published BOOLEAN DEFAULT FALSE,
    category INT REFERENCES categories(Id),
    articleDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    featureImage VARCHAR(255)
);

-- Insert into categories

INSERT INTO categories (name)
VALUES
('Artificial Intelligence'),
('Data Analytics'),
('Edge Computing'),
('Virtual Reality Development'),
('Autonomous Vehicles'),
('Cyber-Physical Systems');


-- Insert into articles

INSERT INTO articles (title, content, author, published, category, articleDate)
VALUES
('Data Analytics Advances ', 
 'Business decision making is depend upon...', 
 'John Doe', 
 true, 
 2, 
 '2024-02-20'),

('Edge content delivery networks', 
 'Aws cloudfornt providing edge delivery...', 
 'Jane Smith', 
 true, 
 3, 
 '2024-03-01'),

('Virtual Reality ', 
 'Virtual Reality (VR) and it importance in gamming...', 
 'Mike Brown', 
 false, 
 4, 
 '2024-03-15'),

('Autonomous Vehicles Tesla', 
 'The development and challenges in Tesla...', 
 'Emily Davis', 
 true, 
 5, 
 '2024-04-01'),

('Cyber-Security', 
 'Autonomus security testing systems...', 
 'Chris Wilson', 
 false, 
 6, 
 '2024-04-10');
