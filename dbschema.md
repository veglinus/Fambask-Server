# Database Schema

## vue-projekt.families
_id: ObjectId
familyName: String

shoppingList: Array // Obsolete?
    0: String
    1: String
    etc

Shows info about current family, the family name


## vue-projekt.users
_id: ObjectId
username: String
password: String
familyId: ObjectId correlated to ObjectId in vue.projekt.families

Used for user authentication and what family you're in


## vue-projekt.entries
_id: ObjectId
userID: ObjectId of vue-projekt.users
familyID: ObjectId of vue-projekt.families
progress: bool
timestamp from ObjectId

For all products added to a familys shopping list