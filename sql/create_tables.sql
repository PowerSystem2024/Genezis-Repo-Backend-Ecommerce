-- Archivo: sql/create_tables.sql (Completo y Actualizado)

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
                       firstname VARCHAR(100) NOT NULL,
                       lastname VARCHAR(100) NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
                       "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
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
                          coverimageurl VARCHAR(255),
                          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
                          categoryid INTEGER,
                          
                          -- ========= NUEVA COLUMNA AÑADIDA =========
                          specs JSONB DEFAULT NULL, 
                          -- =========================================

                          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          CONSTRAINT fk_category
                              FOREIGN KEY(categoryid)
                                  REFERENCES Categories(id)
                                  ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Tabla: ProductImages
-- -----------------------------------------------------
CREATE TABLE ProductImages (
                               id SERIAL PRIMARY KEY,
                               imageurl VARCHAR(255) NOT NULL,
                               alttext VARCHAR(255),
                               productid INTEGER NOT NULL,
                               createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT fk_product
                                   FOREIGN KEY(productid)
                                       REFERENCES Products(id)
                                       ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla: Orders
-- -----------------------------------------------------
CREATE TABLE Orders (
                        id SERIAL PRIMARY KEY,
                        userid INTEGER NOT NULL,
                        totalamount DECIMAL(10, 2) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
                        paymentgatewayid VARCHAR(255),
                        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_user
                            FOREIGN KEY(userid)
                                REFERENCES Users(id)
                                ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Tabla: OrderDetails
-- -----------------------------------------------------
CREATE TABLE OrderDetails (
                              id SERIAL PRIMARY KEY,
                              orderid INTEGER NOT NULL,
                              productid INTEGER,
                              quantity INTEGER NOT NULL,
                              priceatpurchase DECIMAL(10, 2) NOT NULL,
                              CONSTRAINT fk_order
                                  FOREIGN KEY(orderid)
                                      REFERENCES Orders(id)
                                      ON DELETE CASCADE,
                              CONSTRAINT fk_product_detail
                                  FOREIGN KEY(productid)
                                      REFERENCES Products(id)
                                      ON DELETE RESTRICT
);