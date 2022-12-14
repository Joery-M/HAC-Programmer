const countersElem = document.querySelector("#counters tbody");

document.querySelector("#addButton").onclick = async () =>
{
    await createCounter();
    save();
};

(async () =>
{
    if (localStorage.length == 0)
    {
        localStorage.setItem("counters", JSON.stringify([
            {
                name: (await translate("Counter")) + " 1",
                value: "0",
                autoName: true,
                active: false
            }
        ]));
    }
})();

//? Load data
if (localStorage.getItem("counters"))
{
    var counters = localStorage.getItem("counters");

    counters = JSON.parse(counters);
    counters.forEach(async (data) =>
    {
        var counter = await createCounter();

        if (data.autoName)
        {
            counter.querySelector('[type="text"]').placeholder = data.name;
        } else
        {
            counter.querySelector('[type="text"]').value = data.name;
        }
        counter.querySelector("#num").value = data.value;
        counter.querySelector(".useThis").checked = data.active;

        countersElem.appendChild(counter);
    });
    document.querySelector("tbody").style.height = document.querySelector("tbody").scrollHeight + "px";
}

//? Save data
async function save ()
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

        if (!counter.querySelector('[type="text"]').value)
        {
            collectedData.autoName = true;
        }

        collectedData.name = counter.querySelector('[type="text"]').value || (await translate("Counter")) + " " + (i + 1);
        collectedData.value = counter.querySelector("#num").value || 0;
        collectedData.active = counter.querySelector(".useThis").checked || false;

        dataList.push(collectedData);
    };

    localStorage.setItem("counters", JSON.stringify(dataList));
}


async function createCounter ()
{
    var id = `counter-${countersElem.children.length}`;

    var counter = document.createElement("tr");
    counter.id = id;

    counter.innerHTML = `
    <td><input type="radio" name="useCounter" class="useThis"></td>
    <td><input type="text" placeholder="${await translate("Counter")} ${countersElem.children.length + 1}"></td>
    <td><input type="number" id="num" value="0"></td>
    <td><button>${await translate("Delete")}</button></td>
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
    counter.querySelectorAll("input").forEach((elem) =>
    {
        if (elem.type == "radio")
        {
            elem.onchange = save;
        } else
        {
            elem.oninput = save;
        }
    });

    countersElem.appendChild(counter);

    tbody.style.overflowY = "hidden";
    setTimeout(() =>
    {
        tbody.style.height = tbody.scrollHeight + "px";
        tbody.style.overflowY = "auto";
    }, 0);

    calcTableHeight();
    return counter;
}

onAddValue(() =>
{
    if (!document.querySelector(".useThis:checked"))
    {
        return;
    }
    var row = document.querySelector(".useThis:checked").parentElement.parentElement;

    row.querySelector("#num").value++;
    save();
});

(async () =>
{
    document.querySelector("#addButton").innerHTML = await translate("Add counter");
    document.querySelectorAll("th:not(:last-child)").forEach(async (header) =>
    {
        header.innerHTML = await translate(header.innerHTML);
    });
})();