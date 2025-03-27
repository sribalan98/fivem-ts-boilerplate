/// <reference types="@citizenfx/server" />
/// <reference types="@citizenfx/client" />

type EventCallback = (...args: any[]) => void | Promise<void>;

const CRModule = {
  AddEventHandler(event: string, callback: EventCallback) {
    on(event, callback);
  },

  TriggerEvent(event: string, ...args: any[]) {
    emit(event, ...args);
  },

  TriggerServerEvent(event: string, ...args: any[]) {
    emitNet(event, ...args);
  },

  TriggerClientEvent(event: string, playerId: number | string, ...args: any[]) {
    emitNet(event, playerId, ...args);
  },

  RegisterNetEvent(event: string, callback?: EventCallback) {
    if (!callback) {
      callback = () => {};
    }
    onNet(event, callback);
  },

  async Wait(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  },

  SetTick(callback: EventCallback) {
    return setTick(callback);
  },

  ClearTick(tickId: number) {
    clearTick(tickId);
  },

  SetTimeout(callback: EventCallback, ms: number) {
    return setTimeout(callback, ms);
  },

  async CitizenWait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  CreateThread(delay: number, callback: EventCallback) {
    const threadId = setTick(async () => {
      await Wait(delay);
      callback();
    });

    return () => clearTick(threadId);
  },
};

// Exporting the functions as ESM
export const AddEventHandler = CRModule.AddEventHandler;
export const TriggerEvent = CRModule.TriggerEvent;
export const TriggerServerEvent = CRModule.TriggerServerEvent;
export const TriggerClientEvent = CRModule.TriggerClientEvent;
export const RegisterNetEvent = CRModule.RegisterNetEvent;
export const Wait = CRModule.Wait;
export const SetTick = CRModule.SetTick;
export const ClearTick = CRModule.ClearTick;
export const SetTimeout = CRModule.SetTimeout;
export const CitizenWait = CRModule.CitizenWait;
export const CreateThread = CRModule.CreateThread;

export default CRModule;
