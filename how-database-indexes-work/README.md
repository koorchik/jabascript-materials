**Download SQL dumps**
* [1k records file](https://drive.google.com/file/d/1P-TWW_2_L4lLYttjoftl8I9BwOXjb-ES/view?usp=sharing)
* [10 mln records file](https://drive.google.com/file/d/11A8ZBTupBwa0ISxqSlIZaMoJJt3FTwle/view?usp=sharing)


**Install docker and run mysql**

1. Install docker and docker-compose
2. Run docker-compose up
3. Admin UI is available on http://localhost:8888 (user: root, password: password, db: mydb)

**Import data**

Find container id with `docker ps` command. Let's assume that it is "cf1606d409ba".

In this case, import will look like:

```bash
docker exec -i cf1606d409ba  mysql -uroot -ppassword mydb < data.sql
```

You can run CLI client in docker container:

```bash
docker exec -it d36185b37eea mysql -u root -ppassword
```

**Example queries**

```SQL
SELECT * FROM products WHERE name = 'Incredible Fresh Hat Awesome Concrete Shirt';
```
```SQL
SELECT count(*) FROM products WHERE name like 'Handmade Soft Keyboard%';
```
```SQL
SELECT count(*) FROM products WHERE name like '%Soft Keyboard Generic%';
```
