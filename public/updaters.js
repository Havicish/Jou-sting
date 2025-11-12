let Updaters = [];

export function AddUpdater(Callback, DelCondition = null, Priority = 0) {
  Updaters.push({ Callback, DelCondition, Id: Math.random().toString(36).substring(2, 9), Priority });
  Updaters.sort((a, b) => b.Priority - a.Priority); // Sort by priority
  return Updaters[Updaters.length - 1].Id;
}

export function RemoveUpdater(Id) {
  Updaters = Updaters.filter(Updater => Updater.Id !== Id);
}

export function UpdateAll(DT) {
  for (let Updater of Updaters) {
    Updater.Callback(DT);

    if (Updater.DelCondition != null) {
      if (Updater.DelCondition() == true) {
        RemoveUpdater(Updater.Id);
      }
    }
  }
}