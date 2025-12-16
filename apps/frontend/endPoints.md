### All router paths:

1. /json - /media/json - catalog on the server: base of our database.
2. /bloks - blocks control endpoints, /media/json/block_collection/block_collection.json:
    - GET /collection - : get complete collection of blocks
    - POST : create new block
    - PUT/{block_id}: renew existing block
    - DELETE/{block_id}: delete block
3. /hopper - media/hopper - catalog on the server: hopper of uploded files
    - GET /hopper/content - return list of images in the /media/hopper catalog
    - DELETE/{hopper_id} - delete file with hopper_id neme from the hopper
4. /upload - no catalog, just endpoints:
    - POST - upload new file to the hopper with name as it was on original comp (better be moved to the /hopper endpoints)
    - GET/by-name/{name} - returns file with name: name from the hopper?????? obsolete
5. /art - /media/arts - catalog on the server: vault of the arts
    - POST /catalog/update - return current catalog vertion
    - GET/dependencies/{id} - UNDONE - list of blocks and streams that use art with id
    - DELETE/catalog/{id} - delete item with id form catalog
