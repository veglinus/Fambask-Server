# DT162G projekt
 
Backend för projekt

Run ```npm install``` aftert cloning
Start with ```npm start```

## Flowchart

User creates a new user, chooses new or existing family to join

Create user in vue-projekt.users
and/or add new family in vue-projekt.families

View all entries of current family:
get family id; then find all entries where familyID = yours

User adds a new object:
add data:
userID, familyID, content1, content2, progress(bool)

User "checkmarks" an object:
edit vue-projekt.entries where objectID= pressed, edit progress(bool)

User deletes an object:
delete from vue-projekt.entries where ObjectID = pressed