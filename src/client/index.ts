import Config from "@common/config";
import Locale from "@common/locale";

RegisterCommand(
  Config.RegisterCommand,
  () => {
    console.log(Locale("common"), "I am Client Side");
  },
  false
);
