export default {
	updateCustomerRate: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		const oldRate = await get_customerRate.run({currentRow});
		await update_customerPrice.run({currentRow});
		if(oldRate === null){
			await update_todaysOrderRates.run({currentRow});
		} else {
			await update_allOrderRates.run({currentRow});
		}
		await get_custpricelist.run(() => { showAlert('Well done!.','success')}, () => {});
	},
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
	},
		runselect: async () => {
		resetWidget('Select1')
		resetWidget('Table3')
			await Query1.run()
		StoreActions.runQuery('Query1')
	},
	runQuery: async (queryName) => {
		const queries = {
		"Query1": Query1,
		"Query2": Query2,
		"Query3": Query3
		}
		await queries[queryName]?.run();
		//Table3.tableData = queries[queryName].data
		await storeValue('tableData', queries[queryName].data)
	},
	updatePrinterTier: async () => {
		//verify that the start date is greater then the end date
		if(moment(Start_datePicker.selectedDate).isAfter(End_datePicker.selectedDate)){
			await showAlert("Start Date must come before End Date", "error");
			return;
		}
		
		//change the printer tier to be the one selected
		await set_printerTier.run();
		
		//change all of the printer line items in date range to have the tier pricing to match
	 	const printerName = Printer_select.selectedOptionLabel;
		const printerInfo = await get_printer_info.run({printerName});
		const allItems = await get_selected_printer_item_all.run({invoiceID: Table2.selectedRow.InvoiceNo})
		const itemsList = allItems.map(item => {
			return {
				printerId: printerInfo[0].Id,
				printerTier: printerInfo[0].tier_level_id,
				productId: item.ProductID,
				itemId: item.Id,
				qty: item.Qty
			}
		})
		await storeValue('printerItemsList',JSON.parse(JSON.stringify(itemsList).replaceAll("'", "''")));	
		await set_printer_price.run();
		
		await get_current_tier.run()
	}
}
