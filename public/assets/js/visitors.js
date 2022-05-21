// let url = "http://localhost:4000";
let url = "http://localhost:4000"


const visitors = async () => {
    console.log("visitors");
    try {
        const { data } = await axios.get(`${url}/getVisitors`);
        console.log(data.data);
        document.getElementById("daily").innerHTML = data.data.today.visitors;
        document.getElementById("monthly").innerHTML = data.data.monthly.visitors;
        document.getElementById("all").innerHTML = data.data.allVisitors;
    }
    catch (err) {
        console.log(err)
    }

}
visitors();