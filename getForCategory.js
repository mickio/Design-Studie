exports = async function(category,page=0,count=12){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/

  var skip = page * count;

  // Get a collection from the context
  var boox = context.services.get("mongodb-atlas").db("boox").collection("mdata");

  var result, numberOfItems;
  try {

    // Execute a Find in MongoDB 
    result = await boox.find({ categories: category }).skip(skip).limit(count);
    numberOfItems = boox.count({ categories: category })

  } catch(err) {
    console.log("Error occurred while executing find:", err.message);

    return { error: err.message };
  }

  return { numberOfItems, result };
};