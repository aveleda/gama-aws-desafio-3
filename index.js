// API Gateway - REST API
// AWS Lamdba

const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let myId;
  let timestamp;
  let requestJSON;
  let client_timestamp;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    if (event.resource == "/{id}") {
      switch (event.httpMethod){
        case "GET":
          body = await dynamo.get({
            TableName: "gama-desafio-3",
            Key: {
              email: event.pathParameters.id
            }
          }).promise();
          break;
        case "PUT":
          requestJSON = JSON.parse(event.body);
          timestamp = Date.now();
          const query = await dynamo.get({
            TableName: "gama-desafio-3",
            Key: {
              email: event.pathParameters.id
            }
          }).promise();
          if (query.Item.timestamp != null){
            client_timestamp = query.Item.timestamp;
          } else {
            client_timestamp = timestamp;
          }
          if (query.Item.id != null){
            myId = query.Item.id;
          } else {
            myId = context.awsRequestId;
          }
          await dynamo
            .put({
              TableName: "gama-desafio-3",
              Item: {
                id: myId,
                email: event.pathParameters.id,
                nome: requestJSON.nome,
                telefone: requestJSON.telefone,
                tipo: requestJSON.tipo,
                timestamp: client_timestamp,
                update_timestamp: timestamp
              }
            })
            .promise();
          const date_cliente = Date(timestamp).toString();
          body = {
            "Message": "Updated id " + event.pathParameters.id, 
            "Date": date_cliente
          };
          break;
        case "DELETE":
          await dynamo
            .delete({
              TableName: "gama-desafio-3",
              Key: {
                email: event.pathParameters.id
              }
            })
            .promise();
          body = { "Message": "Deleted item " + event.pathParameters.id};
          break;
        default:
          throw new Error(`Unsupported route: "${event.httpMethod}"`);
      } 
    } else if (event.resource == "/"){
      switch (event.httpMethod){
        case "GET":
          body = await dynamo.scan({ 
            TableName: "gama-desafio-3" 
          }).promise();
          break;
        case "POST":
          requestJSON = JSON.parse(event.body);
          timestamp = Date.now();
          await dynamo
            .put({
              TableName: "gama-desafio-3",
              Item: {
                id: context.awsRequestId,
                nome: requestJSON.nome,
                telefone: requestJSON.telefone,
                email: requestJSON.email,
                tipo: requestJSON.tipo,
                timestamp: timestamp
              }
            }).promise();
          const date_pro = Date(timestamp).toString();
          body = {
            "Message": "Added id " + context.awsRequestId, 
            "Date": date_pro
          };
          break;
        default:
          throw new Error(`Unsupported route: "${event.httpMethod}"`);
      } 
    } else {
      body = {
        "Message": "Unsupported event: " + event.resource
      };
    }
  } catch (err) {
        statusCode = 400;
        body = err.message;
      } finally {
        body = JSON.stringify(body);
  }
  return {
    statusCode,
    body,
    headers
  };
};
