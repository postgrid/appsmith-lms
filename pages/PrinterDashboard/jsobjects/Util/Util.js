export default {
	getBackground: (status) => {
		if (status =='Active') return "#14532d";
		else if (status =='In progress') return "#854d0e";
		else if (status =='On Hold') return "#b91c1c";
		else if (status =='Discontinued') return "#b91c1c";
		else return "#231f20";
	},  
	clearPicker_orders: async () => {
    await resetWidget("FilePicker1_Orders")
  },
		clearPicker_customers: async () => {
    await resetWidget("FilePicker_customers")
  },
		clearPicker_partners: async () => {
    await resetWidget("FilePicker_partners")
  },
		clearPicker_products: async () => {
    await resetWidget("FilePicker1_Products")
  }
	
}