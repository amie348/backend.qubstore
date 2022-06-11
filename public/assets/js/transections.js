
// let Url = "https://admin.qubstore.com"
let Url = "https://admin.qubstore.com"




// console.log("getting Reviews")
axios.get(`${Url}/transection/get-pending`).then(
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
          <td>
            <button id="${transection._id}" onclick="success(this)" class="btn btn-circle btn-primary" style="height:50px" >Success</button>
          </td>`
      }

    })
    
    $(document).ready(function () {
      $('#myTable').DataTable();
    });
  })
  .catch(err => {
    console.log(err)
  })


function success(element) {

  let id = element.id;

  if(!id) {
    return
  }
  console.log(id)

  axios.patch(`${Url}/transection/complete-transection`, {id})
  .then( response => {
    window.location.reload()
  }).catch(err => {
    console.log(err)
  })

}