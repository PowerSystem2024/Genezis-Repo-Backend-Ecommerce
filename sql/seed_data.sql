-- Archivo: seed_data.sql (Versión Corregida)

BEGIN;

-- Limpiamos y reiniciamos las tablas para asegurar un estado fresco
TRUNCATE TABLE Users, Categories, Products, ProductImages, Orders, OrderDetails RESTART IDENTITY CASCADE;

-- Insertamos los datos de ejemplo (Nombres de columna en minúscula)
INSERT INTO Users (firstname, lastname, email, password, role) VALUES
                                                                   ('Admin', 'Genezis', 'admin@example.com', '$2a$10$wT8dZ3gS.L1G.HjK.N5V7u2B4.Jp/u.o2g9v/Qz.XqK.sL/j0lZpG', 'admin'),
                                                                   ('Carlos', 'Cliente', 'cliente@example.com', '$2a$10$C.iH5gB7F.N4Y/f3K.d/l.t6K.c/B.Z5x.o3g7.w.Q.h/J.j8a9qS', 'customer');

INSERT INTO Categories (name, description) VALUES
                                               ('Electrónica', 'Dispositivos y gadgets de última tecnología.'),
                                               ('Ropa y Accesorios', 'Moda para hombres, mujeres y niños.'),
                                               ('Hogar y Jardín', 'Todo lo que necesitas para tu casa y espacios exteriores.'),
                                               ('Libros', 'Desde novelas de ficción hasta libros de texto y de no ficción.');

INSERT INTO Products (name, description, price, stock, coverimageurl, categoryid) VALUES
                                                                                      ('Laptop Gamer Pro v2', 'Potente laptop con tarjeta gráfica de última generación y 32GB de RAM.', 1499.99, 15, 'https://placehold.co/600x400/2D3748/E2E8F0?text=Laptop', 1),
                                                                                      ('Smartphone Nexus X', 'El último modelo con cámara de 108MP y pantalla OLED de 120Hz.', 899.50, 45, 'https://placehold.co/600x400/2D3748/E2E8F0?text=Smartphone', 1),
                                                                                      ('Auriculares Inalámbricos SoundPro', 'Cancelación de ruido activa y hasta 40 horas de batería.', 199.99, 120, 'https://placehold.co/600x400/2D3748/E2E8F0?text=Auriculares', 1),
                                                                                      ('Camiseta de Algodón Orgánico', 'Suave, cómoda y disponible en 5 colores.', 29.99, 250, 'https://placehold.co/600x400/4A5568/E2E8F0?text=Camiseta', 2),
                                                                                      ('Zapatillas Urban Runner', 'Diseño moderno y suela ultra ligera para el día a día.', 85.00, 80, 'https://placehold.co/600x400/4A5568/E2E8F0?text=Zapatillas', 2),
                                                                                      ('Juego de Herramientas 100 piezas', 'Completo set de herramientas para reparaciones en el hogar.', 120.00, 60, 'https://placehold.co/600x400/718096/E2E8F0?text=Herramientas', 3),
                                                                                      ('El Arte de Programar', 'Una guía completa sobre algoritmos y estructuras de datos.', 45.50, 150, 'https://placehold.co/600x400/A0AEC0/E2E8F0?text=Libro', 4);

INSERT INTO ProductImages (imageurl, alttext, productid) VALUES
                                                             ('https://placehold.co/600x400/2D3748/E2E8F0?text=Laptop+Vista+1', 'Vista frontal de la Laptop Gamer Pro v2', 1),
                                                             ('https://placehold.co/600x400/2D3748/E2E8F0?text=Laptop+Vista+2', 'Teclado retroiluminado de la Laptop Gamer Pro v2', 1),
                                                             ('https://placehold.co/600x400/2D3748/E2E8F0?text=Smartphone+Vista+1', 'Parte trasera del Smartphone Nexus X mostrando cámaras', 2),
                                                             ('https://placehold.co/600x400/4A5568/E2E8F0?text=Zapatillas+Detalle', 'Detalle de la suela de las Zapatillas Urban Runner', 5);

COMMIT;
