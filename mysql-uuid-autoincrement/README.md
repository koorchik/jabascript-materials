**Download and unzip SQL dump**
* [16 mln records file](https://drive.google.com/drive/folders/1Id_v0nqeoPjqwxmPSZs4etDFAooCerDV?usp=sharing)

**Install docker and run mysql**

1. Install docker and docker-compose
2. Run docker-compose up
3. Admin UI is available on http://localhost:8888 (user: root, password: password, db: mydb)

**Import data**

Find container id with `docker ps` command. Let's assume that it is "cf1606d409ba".

In this case, import will look like:

```bash
docker exec -i cf1606d409ba  mysql -uroot -ppassword mydb < dump.sql
```

You can run CLI client in docker container:

```bash
docker exec -it d36185b37eea mysql -u root -ppassword
```

## Tables
```SQL
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `brand` varchar(255) NOT NULL DEFAULT '',
  `price` int NOT NULL DEFAULT '0',
  `archived` tinyint NOT NULL DEFAULT '0',
  `year` smallint NOT NULL,
  `number` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `products_uuid_pk` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `brand` varchar(255) NOT NULL DEFAULT '',
  `price` int NOT NULL DEFAULT '0',
  `archived` tinyint NOT NULL DEFAULT '0',
  `year` smallint NOT NULL,
  `number` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `products_uuid_column` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `brand` varchar(255) NOT NULL DEFAULT '',
  `price` int NOT NULL DEFAULT '0',
  `archived` tinyint NOT NULL DEFAULT '0',
  `year` smallint NOT NULL,
  `number` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;
```

## Queries to create indexes
**Products table with UUID as PK**
```SQL
CREATE INDEX `name` ON products_uuid_pk (`name`);
CREATE INDEX `brand` ON products_uuid_pk (`brand`);
CREATE INDEX `price` ON products_uuid_pk (`price`);
CREATE INDEX `archived` ON products_uuid_pk (`archived`);
CREATE INDEX `year` ON products_uuid_pk (`year`);
CREATE INDEX `number` ON products_uuid_pk (`number`);
```

**Products table with UUID column**
```SQL
CREATE INDEX `name` ON products_uuid_column (`name`);
CREATE INDEX `brand` ON products_uuid_column (`brand`);
CREATE INDEX `price` ON products_uuid_column (`price`);
CREATE INDEX `archived` ON products_uuid_column (`archived`);
CREATE INDEX `year` ON products_uuid_column (`year`);
CREATE INDEX `number` ON products_uuid_column (`number`);
CREATE INDEX `uuid` ON products_uuid_column (`uuid`);
```

**Products table with autoincrement PK**
```SQL
CREATE INDEX `name` ON products (`name`);
CREATE INDEX `brand` ON products (`brand`);
CREATE INDEX `price` ON products (`price`);
CREATE INDEX `archived` ON products (`archived`);
CREATE INDEX `year` ON products (`year`);
CREATE INDEX `number` ON products (`number`);
```

**Covering index**
```SQL
CREATE INDEX `year_name` ON products (`year`, `name`); 
```

## Example queries

```SQL
SELECT id, name FROM products ORDER BY year LIMIT 1;
```

```SQL
SELECT id, name FROM products ORDER BY year LIMIT 1 OFFSET 1000000;
```

```SQL
SELECT * FROM products WHERE name = 'David unholiest mufti';
```

```SQL
SELECT * FROM products WHERE name like 'David unholiest%';
```

```SQL
SELECT * FROM products WHERE description like '%unholiest%';
```

```SQL
SELECT * FROM products WHERE description like '%joyriders paragraphs downfall%';
```


paragraphs downfall

## Getting stats

**Show totals**
```SQL
SELECT table_name,
SUM(ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2)) size_in_mb
FROM mysql.innodb_index_stats
WHERE stat_name = 'size'
GROUP BY table_name;
```

**Show only secondary indexes totals**
```SQL
SELECT table_name,
SUM(ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2)) size_in_mb
FROM mysql.innodb_index_stats
WHERE stat_name = 'size' AND index_name != 'PRIMARY'
GROUP BY table_name;
```

**Show detailed indexes stats**
```SQL
SELECT database_name, table_name, index_name,
ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2) size_in_mb
FROM mysql.innodb_index_stats
WHERE stat_name = 'size'
ORDER BY size_in_mb DESC;
```

### File sizes
**No indexes**
```
-rw-r----- 1 mysql mysql 4.4G Mar  4 18:58 products.ibd
-rw-r----- 1 mysql mysql 5.1G Mar  4 18:58 products_uuid_column.ibd
-rw-r----- 1 mysql mysql 8.1G Mar  4 18:58 products_uuid_pk.ibd
```

**Standard indexes**
```
-rw-r----- 1 mysql mysql 6.3G Mar  4 19:14 products.ibd
-rw-r----- 1 mysql mysql 7.0G Mar  4 19:12 products_uuid_column.ibd
-rw-r----- 1 mysql mysql  14G Mar  4 19:09 products_uuid_pk.ibd
```

**Standard indexes + uuid index for extra column**
```
-rw-r----- 1 mysql mysql 6.3G Mar  4 19:14 products.ibd
-rw-r----- 1 mysql mysql 7.8G Mar  4 19:16 products_uuid_column.ibd
-rw-r----- 1 mysql mysql  14G Mar  4 19:09 products_uuid_pk.ibd
```