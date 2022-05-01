import { flagsParams } from "./flagsConfig";

export function createSelect(parent: HTMLElement) : HTMLSelectElement {
   const select = document.createElement("select");
   select.id = "country-flags";
   select.classList.add(...["select", "select-bordered"]);

   const noneOption = document.createElement("option");
   noneOption.value = "";
   noneOption.innerHTML = "None";
   select.appendChild(noneOption);

   flagsParams.forEach(({ name }) => {
      const option = document.createElement("option");
      option.value = name;
      option.innerHTML = name;
      select.appendChild(option);
   });
   parent.appendChild(select);
   return select;
}

export function createImages(parent: HTMLElement) {
  flagsParams.forEach(({ name }) => {
    const img : HTMLImageElement = document.createElement("img");
    img.id = name;
    img.alt = `Flag of ${name}`;
    img.src = require(`../static/textures/${name}.png`);
    img.classList.add("imageSrc");
    parent.appendChild(img);
  });
}