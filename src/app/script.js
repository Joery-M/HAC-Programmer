const countersElem = document.querySelector("#counters tbody");

document.querySelector("#addButton").onclick = () =>
{
    createCounter()
    save();
};



//? Load data
if (localStorage.getItem("counters"))
{
    var counters = localStorage.getItem("counters");

    counters = JSON.parse(counters);
    counters.forEach((data) =>
    {
        var counter = createCounter()

        if (data.autoName) {
            counter.querySelector('[type="text"]').placeholder = data.name;
        }else{
            counter.querySelector('[type="text"]').value = data.name;
        }
        counter.querySelector("#num").value = data.value;
        counter.querySelector(".useThis").checked = data.active;

        countersElem.appendChild(counter);
    });
    document.querySelector("tbody").style.height = document.querySelector("tbody").scrollHeight + "px";
}

//? Save data
function save ()
{
    var children = countersElem.children;
    var dataList = [];
    for (var i = 0; i < children.length; i++)
    {
        var counter = children[i];
        var collectedData = {
            name: "",
            value: "",
            autoName: false,
            active: false
        };

        if (!counter.querySelector('[type="text"]').value) {
            collectedData.autoName = true
        }

        collectedData.name = counter.querySelector('[type="text"]').value || "Counter " + (i + 1);
        collectedData.value = counter.querySelector("#num").value || 0;
        collectedData.active = counter.querySelector(".useThis").checked || false;

        dataList.push(collectedData);
    };

    localStorage.setItem("counters", JSON.stringify(dataList));
}


function createCounter ()
{
    var id = `counter-${countersElem.children.length}`;

    var counter = document.createElement("tr");
    counter.id = id;

    counter.innerHTML = `
    <td><input type="radio" name="useCounter" class="useThis"></td>
    <td><input type="text" placeholder="Counter ${countersElem.children.length + 1}"></td>
    <td><input type="number" id="num" value="0"></td>
    <td><button>Delete</button></td>
    `;

    var tbody = document.querySelector("tbody");
    //? Delete
    counter.querySelector("button").addEventListener("click", () =>
    {
        counter.remove();
        tbody.style.height = "1px";
        tbody.style.height = tbody.scrollHeight + "px";

        save();
    });

    //? Change value
    counter.querySelectorAll("input").forEach((elem)=>{
        if (elem.type == "radio") {
            elem.onchange = save
        }else{
            elem.oninput = save
        }
    })

    countersElem.appendChild(counter);

    tbody.style.overflowY = "hidden"
    setTimeout(() => {
        tbody.style.height = tbody.scrollHeight + "px";
        tbody.style.overflowY = "auto"
    }, 0);

    calcTableHeight()
    return counter
}

onAddValue(()=>{
    if (!document.querySelector(".useThis:checked")) {
        return
    }
    var row = document.querySelector(".useThis:checked").parentElement.parentElement

    console.log(row);
    row.querySelector("#num").value++
    save()
})