
let Url = "https://admin.qubstore.com";
var apks = [];
var requiredApk = [];

function check(index, alreadyChecked) {
  console.log(`index`, index)
  if (!alreadyChecked) {
    document.getElementById(index).click();
  }
  let checked = document.getElementById(index).checked;
  if (checked) {
    requiredApk.push(apks[index]);
  }
  else {
    requiredApk = requiredApk.filter(apk => apk != apks[index]);
  }
  console.log(`requiredApks`, requiredApk);
}




var name = localStorage.getItem("username");
axios.get(`${Url}/user/links/${name}`).then(
  response => {
    console.log(response.data)
    apks = [...response.data.apks]
    apks.forEach((apk, index) => {
      let op = ` 
      <label for="${index}">
      <input type="checkbox" id="${index}"  onclick="check(${index}, true)"/>
      ${apk}</label> `;
      document.getElementById(`checkBoxes`).innerHTML += op;
    });

    document.getElementById("downloads").innerHTML = response.data.user.downlaods;
    document.getElementById("ppd").innerHTML = `$` + response.data.user.pricePerDownlaod;
    document.getElementById("total").innerHTML = `$` + response.data.user.totalPrice;
    document.getElementById("invite-link").innerHTML = `https://qubstore.com/signup.html?inviteId=${response.data.user._id}` 
    response.data.user.links.forEach((individual, index) => {

      document.getElementById("table-body").innerHTML += `<tr>
            
            <td class="center">
              ${index + 1}
            </td>
            <td>
              ${individual.link}
            </td>
            <td class="center">
              ${individual.apk}
            </td>
            <td class="center">
              ${individual.downloads ? individual.downloads: 0}
            </td>
            
            </tr>`


    });
    $(document).ready(function () {
      // DataTable initialisation
      $('#myTable').DataTable();
    });




  }
)
  .catch(err => {
    console.log(err)
  })

document.getElementById(`create`).addEventListener(`click`, () => {
  if (requiredApk.length) {

    axios.post(`${Url}/user/createLinks`,
      { name, requiredApk }).then(response => {
        console.log(response.data)

        if (response.data.hasError) {
          alert(`error occured`);
        }
        window.location.reload()
      }).catch(error => {
        console.log(error.response.data)
        alert(`error occured`);
      })
  }
})