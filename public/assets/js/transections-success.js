
// let Url = "http://localhost:4000"
let Url = "http://localhost:4000"




// console.log("getting Reviews")
axios.get(`${Url}/transection/get-success`).then(
  response => {
    console.log(response.data.data);

    document.getElementById("table-body").innerHTML += ``;

    response.data.data.forEach(transection => {

      if(transection.to.name){

        document.getElementById("table-body").innerHTML += `<tr>
          <td class="center">
            ${transection._id}
          </td>
          <td>
            ${transection.to.name}
          </td>
          <td>
            ${transection.to.account}
          </td>
          <td>
            ${transection.amount}
          </td>
          `
      }

    })
    
    $(document).ready(function () {
      $('#myTable').DataTable();
    });
  })
  .catch(err => {
    console.log(err)
  })
