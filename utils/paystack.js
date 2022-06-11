const https = require('https');



const create = {
  hostname: 'api.paystack.co',
  port: 443,
  path: '/transaction/initialize',
  method: 'POST',
  headers: {
    Authorization: 'Bearer sk_test_fe1a7509d6c840ae101e6bf1c7059c9a22c9ec9f',
    'Content-Type': 'application/json'
  }
}


const createReq = https.request(create, res => {
  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  });
  res.on('end', () => {
    console.log(JSON.parse(data))
  });
}).on('error', error => {
  console.error(error)
});

const createReference = async(email, amount) => {

    const params = JSON.stringify({
        "email": email,
        "amount": amount
      });

    createReq.write(params);
    createReq.end();

};



module.exports = {

    createReference

}
