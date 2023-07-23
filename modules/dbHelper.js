async function updateDocument(client, dbParams, filter, update) {
  try {
    await client.connect();
    const collection = client
      .db(dbParams.mydb)
      .collection(dbParams.collectionName);
    const options = { returnOriginal: false };
    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result.value) {
      console.log(
        `Document with fixture.id ${filter["fixture.id"]} was updated.`
      );
    } else {
      console.log(
        `No document with fixture.id ${filter["fixture.id"]} was found.`
      );
    }
  } catch (error) {
    console.error(
      `Error updating document with fixture.id ${filter["fixture.id"]}:`,
      error
    );
  } finally {
    client.close();
  }
}

module.exports = {
  updateDocument,
};
