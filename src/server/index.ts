import CRModule from "@common/CRModule";

CRModule.CreateThread(3000, () => {
  console.log("i am server Running On Delay 3 Sec");
});
