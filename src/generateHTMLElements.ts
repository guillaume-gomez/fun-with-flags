import { generateFlagParams } from "./flagsConfig";

export function createSelect(parent: HTMLElement) : HTMLSelectElement {
   const select = document.createElement("select");
   select.id = "country-flags";
   select.classList.add(...["select", "select-bordered"]);

   const noneOption = document.createElement("option");
   noneOption.value = "";
   noneOption.innerHTML = "None";
   select.appendChild(noneOption);

   generateFlagParams().forEach(({ key, name }) => {
      const option = document.createElement("option");
      option.value = key;
      option.innerHTML = name;
      select.appendChild(option);
   });
   parent.appendChild(select);
   return select;
}

export function createImages(parent: HTMLElement) {
  generateFlagParams().forEach(({ key, name }) => {
    const img : HTMLImageElement = document.createElement("img");
    img.id = key;
    img.alt = `Flag of ${name}`;
    img.src = require(`../static/textures/${key}.png`);
    img.classList.add("imageSrc");
    parent.appendChild(img);
  });
}