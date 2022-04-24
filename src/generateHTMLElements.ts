const countries = [
  "argentine",
  "brazilSimp",
  "cote-ivoire",
  "danemark",
  "france",
  "iceland",
  "lebanon"
];

export function createSelect(parent: HTMLElement) : HTMLSelectElement {
   const select = document.createElement("select");
   select.id = "country-flags";

   const noneOption = document.createElement("option");
   noneOption.value = "";
   noneOption.innerHTML = "None";
   select.appendChild(noneOption);

   countries.forEach(country => {
      const option = document.createElement("option");
      option.value = country;
      option.innerHTML = country;
      select.appendChild(option);
   });
   parent.appendChild(select);
   return select;
}

export function createImages(parent: HTMLElement) {
  countries.forEach(country => {
    const img : HTMLImageElement = document.createElement("img");
    img.id = country;
    img.alt = `Flag of ${country}`;
    img.src = require(`../static/textures/${country}.png`);
    img.classList.add("imageSrc");
    parent.appendChild(img);
  });
}