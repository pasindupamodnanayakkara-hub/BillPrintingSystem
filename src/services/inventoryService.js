const INVENTORY_KEY = 'BILL_STUDIO_INVENTORY';

export const getInventory = () => {
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveInventory = (items) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
};

export const addItem = (item) => {
  const inventory = getInventory();
  const newItem = {
    ...item,
    id: Date.now().toString()
  };
  inventory.push(newItem);
  saveInventory(inventory);
  return inventory;
};

export const updateItem = (id, updatedData) => {
  const inventory = getInventory();
  const index = inventory.findIndex(item => item.id === id);
  if (index !== -1) {
    inventory[index] = { ...inventory[index], ...updatedData };
    saveInventory(inventory);
  }
  return inventory;
};

export const deleteItem = (id) => {
  const inventory = getInventory().filter(item => item.id !== id);
  saveInventory(inventory);
  return inventory;
};
