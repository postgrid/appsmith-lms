export default {
	getcustcsv: () => {
	if (!FilePicker_customers.files.length) return '';
			const csvRows = FilePicker_customers.files[0].data.split("\n");
			const objArr = [];
			const headers = csvRows[0].split(',');
			for(let i = 1; i < csvRows.length; i++) {
				const rowObj = {};
				objArr.push(rowObj);
				const rowArr = csvRows[i].split(',');
				rowArr.forEach((val, index) => {
					rowObj[headers[index]] = val;
				});
			}
			return (objArr == []) ? '' : objArr;
	},
	getpartnercsv: () => {
	if (!FilePicker_partners.files.length) return '';
			const csvRows = FilePicker_partners.files[0].data.split("\n");
			const objArr = [];
			const headers = csvRows[0].split(',');
			for(let i = 1; i < csvRows.length; i++) {
				const rowObj = {};
				objArr.push(rowObj);
				const rowArr = csvRows[i].split(',');
				rowArr.forEach((val, index) => {
					rowObj[headers[index]] = val;
				});
			}
			return (objArr == []) ? '' : objArr;
	},	
	getproductcsv: () => {
	if (!FilePicker1_Products.files.length) return '';
			const csvRows = FilePicker1_Products.files[0].data.split("\n");
			const objArr = [];
			const headers = csvRows[0].split(',');
			for(let i = 1; i < csvRows.length; i++) {
				const rowObj = {};
				objArr.push(rowObj);
				const rowArr = csvRows[i].split(',');
				rowArr.forEach((val, index) => {
					rowObj[headers[index]] = val;
				});
			}
			return (objArr == []) ? '' : objArr;
	},
	getordercsv: () => {
	if (!FilePicker1_Orders.files.length) return '';
			const csvRows = FilePicker1_Orders.files[0].data.split("\n");
			const objArr = [];
			const headers = csvRows[0].split(',');
			for(let i = 1; i < csvRows.length; i++) {
				const rowObj = {};
				objArr.push(rowObj);
				const rowArr = csvRows[i].split(',');
				rowArr.forEach((val, index) => {
					rowObj[headers[index]] = val;
				});
			}
			return (objArr == []) ? '' : objArr;
	},	
	reloading: async () => {
	await get_user_department.run();
	//await get_partner.run();
	//await get_order_details.run();
		
	}
}
