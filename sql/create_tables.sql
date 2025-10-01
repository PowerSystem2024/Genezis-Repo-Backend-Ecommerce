-- Archivo: create_tables.sql

-- Borrado de tablas existentes (opcional, para empezar de cero en la nube)
DROP TABLE IF EXISTS OrderDetails CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS ProductImages CASCADE;
DROP TABLE IF EXISTS Products CASCADE;
DROP TABLE IF EXISTS Categories CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- -----------------------------------------------------
-- Tabla: Users
-- -----------------------------------------------------
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Tabla: Categories
-- -----------------------------------------------------
CREATE TABLE Categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Tabla: Products
-- -----------------------------------------------------
CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    coverImageURL VARCHAR(255),
    categoryID INTEGER, -- Permitimos que sea nulo temporalmente
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category
        FOREIGN KEY(categoryID)
        REFERENCES Categories(id)
        ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Tabla: ProductImages
-- -----------------------------------------------------
CREATE TABLE ProductImages (
    id SERIAL PRIMARY KEY,
    imageURL VARCHAR(255) NOT NULL,
    altText VARCHAR(255),
    productID INTEGER NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product
        FOREIGN KEY(productID)
        REFERENCES Products(id)
        ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla: Orders
-- -----------------------------------------------------
CREATE TABLE Orders (
    id SERIAL PRIMARY KEY,
    userID INTEGER NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    paymentGatewayID VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(userID)
        REFERENCES Users(id)
        ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla: OrderDetails
-- -----------------------------------------------------
CREATE TABLE OrderDetails (
    id SERIAL PRIMARY KEY,
    orderID INTEGER NOT NULL,
    productID INTEGER, -- Permitimos que sea nulo temporalmente
    quantity INTEGER NOT NULL,
    priceAtPurchase DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order
        FOREIGN KEY(orderID)
        REFERENCES Orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_product_detail
        FOREIGN KEY(productID)
        REFERENCES Products(id)
        ON DELETE RESTRICT
);