export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		await storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();
		storeValue('show','true')
		storeValue('show2','true')
		await storeValue('customerItems',undefined);
		await storeValue('printerItems',undefined)
	},
	autorefresh: async () => {
		setInterval(() => {
			get_letter_day_volume.run(),
				get_cheque_day_volume.run(), get_postcard_day_volume.run(),get_num_new_clients.run()}, 3000, "autoupdate");
		/*get_invoicelist_count.run()*/
	},
	selectedOrderGroup: async () => {
		await get_customer_order_details.run();
		await get_printer_order_details.run();
		await get_list_of_collaterals.run();
		await storeValue('org','f');
	},
	getSelectedCustomerItems: async () => {
		console.log("JG in")
		await get_customer_order_details.run();
		const customerItems = await get_customer_order_details.data;
		const totalItem = customerItems.find(item => item.itemid === null)
		const parentItems = customerItems.filter(item => item.SubItemID === null && item.itemid !== null);
		let finalArray = [];
		let sort = 0;

		for(const parentItem of parentItems){
			const allItems = customerItems.filter(item => item.SubItemID === parentItem.itemid);
			finalArray.push({...parentItem, sort});
			sort += 1;
			for(const item of allItems){
				if(item.ProductDescription.includes('Extra') || item.ProductDescription.includes('add')){
					if(finalArray[finalArray.length - 1].SubItemId !== null){
						const parentIndex = finalArray.lastIndexOf(prevItem => prevItem.SubItemId === null)
						for(let i = parentIndex + 1; i < finalArray.length; i++){
							if(i = parentIndex + 1){
								const sortNum = finalArray[i].sort;
								finalArray = [
										...finalArray.slice(0, i),
										{...item, sort: sortNum},
										...finalArray.slice(i)
								];
							} else {
								finalArray[i].sort += 1; 
							}
						}
					}
				}
				
				finalArray.push({...item, sort});
				sort += 1;
			}
		}
		finalArray.push(totalItem);
		
		console.log("JG finalArray", finalArray)

		await storeValue('customerItems',finalArray);
	},
	getSelectedPrinterItems: async () => {
		await get_printer_order_details.run();
		const printerItems = await get_printer_order_details.data;
		const totalItem = printerItems.find(item => item.Id === null);
		const parentItems = printerItems.filter(item => item.SubItemID === null && item.Id !==null);
		const finalArray = [];
		let sort = 0;

		for(const parentItem of parentItems){
			const allItems = printerItems.filter(item => item.SubItemID === parentItem.Id);
			finalArray.push({...parentItem, sort});
			sort += 1;
			for(const item of allItems){
				finalArray.push({...item, sort});
				sort += 1;
			}
		}
		finalArray.push(totalItem);

		await storeValue('printerItems',finalArray);
	},
	createNewItems: async () => {
		const uuid = UUID.generate();
		await storeValue("selectedDescription", Select1.selectedOptionLabel)
		await get_product_from_description.run();
		const product = get_product_from_description.data
		const newItem = {
			id: uuid,
			orgID: Table2.selectedRow.OrgID,
			orgName: Table2.selectedRow.CustomerName,

			quantity: Input2.text,
			mailType: product[0].MailType,
			productDesc: product[0].ProductDescription,
			destinationCountryCode: Input3.text,

			parentID: null,
			vendor: null,
			groupID: null,
			pages: null
		}

		await storeValue('newList',JSON.parse(JSON.stringify([newItem]).replaceAll("'", "''")));

		await Promise.all([
			set_customerprice.run(),
			set_customerlineitems.run(),
			set_printerlineitems.run(),
		]).catch(() => {
			showAlert('Error! Unable to process.','error');
		});

		await Util.getSelectedCustomerItems();
		await Util.getSelectedPrinterItems();
		await get_list_of_collaterals.run();
		await storeValue('org','f');
	},
	createNewSubItem: async () => {
		const uuid = UUID.generate();
		await storeValue("selectedDescription", Select1Copy.selectedOptionLabel)
		await get_product_from_description.run();
		const product = get_product_from_description.data

		const newItem = {
			id: uuid,

			orgID: Table2.selectedRow.OrgID,
			orgName: Table2.selectedRow.CustomerName,

			// For these, each sheet is additional, not just those after the first
			quantity: Input2Copy.text,
			mailType: product[0].MailType,
			productDesc: product[0].ProductDescription,
			destinationCountryCode: null,

			parentID: Table3Copy.selectedRow.itemid,
			groupID: null,
			pages: null
		}

		await storeValue('newList',JSON.parse(JSON.stringify([newItem]).replaceAll("'", "''")));

		await Promise.all([
			set_customerprice.run(),
			set_customerlineitems.run(),
			set_printerlineitems.run(),
		]).catch(() => {
			showAlert('Error! Unable to process.','error');
		});
	}
}