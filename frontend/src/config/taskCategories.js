export const taskCategories = [
  {
    id: 'home-maintenance',
    name: 'Home Maintenance',
    icon: 'home',
    subcategories: [
      'Plumbing',
      'Electrical',
      'Carpentry',
      'Painting',
      'General Repairs'
    ]
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'cleaning',
    subcategories: [
      'House Cleaning',
      'Deep Cleaning',
      'Laundry',
      'Window Cleaning',
      'Carpet Cleaning'
    ]
  },
  {
    id: 'gardening',
    name: 'Gardening',
    icon: 'grass',
    subcategories: [
      'Lawn Mowing',
      'Tree Trimming',
      'Planting',
      'Landscaping',
      'Garden Maintenance'
    ]
  },
  {
    id: 'moving',
    name: 'Moving',
    icon: 'local_shipping',
    subcategories: [
      'Furniture Moving',
      'House Moving',
      'Packing',
      'Loading/Unloading',
      'Junk Removal'
    ]
  },
  {
    id: 'tech-support',
    name: 'Tech Support',
    icon: 'computer',
    subcategories: [
      'Computer Repair',
      'Network Setup',
      'Software Installation',
      'Smart Home Setup',
      'Tech Training'
    ]
  }
];

export const getTaskCategory = (categoryId) => {
  return taskCategories.find(category => category.id === categoryId);
};

export const getAllSubcategories = () => {
  return taskCategories.reduce((acc, category) => {
    return [...acc, ...category.subcategories];
  }, []);
};

export const getCategoryBySubcategory = (subcategory) => {
  return taskCategories.find(category => 
    category.subcategories.includes(subcategory)
  );
};
