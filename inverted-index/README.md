### Create database with data
**Download and unzip SQL dump**
* [16 mln records file](https://drive.google.com/file/d/1trDelSg0g0SBLFtqjUx2-9gnrEpI6hqs/view?usp=sharing)

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

### Create inverted index


```bash
# Can take several hours
node bin/indexer/map.mjs | sort -k1,1 | node bin/indexer/reduce.mjs > data/index.data
```

_Or your can run all of steps separately:_

Run map job:
```bash
node bin/indexer/map.mjs >data/pairs.data
```
Sort file:
```bash
sort -k1,1 data/pairs.data >data/sorted.data
```
Run reduce job:
```bash
node bin/indexer/reduce.mjs <data/sorted.data >data/index.data
```

### Run searcher
node bin/searcher.mjs "my query" # returns docs with words from query
node bin/searcher.mjs "my query" exact # returns docs with words in the same exact order

```bash
node bin/searcher.mjs "airmailing wended mahatmas"
node bin/searcher.mjs "airmailing wended mahatmas" exact
```

### Create FTS index in MySQL
```SQL
CREATE FULLTEXT INDEX ftx ON products(description);
```

```SQL
SELECT id FROM products WHERE MATCH (description) AGAINST ('"airmailing wended mahatmas"' IN BOOLEAN MODE);
```
