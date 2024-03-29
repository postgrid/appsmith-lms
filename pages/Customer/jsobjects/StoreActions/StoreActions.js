export default {
	updateCustomerRate: async (currentRow) => {
		await storeValue("updateCustomerRate",currentRow);
		const oldRate = await get_customerRate.run({currentRow});
		await update_customerPrice.run({currentRow});
		if(oldRate[0].Rate === null){
			await update_allOrderRates.run();
			console.log("update_allOrderRates")
		} else {
			const invoiceID = await get_invoiceID_for_Customer.run()
			if(invoiceID.length > 0){
				console.log("JG invoiceID", invoiceID)
			await storeValue("updateCustomerRate",{...currentRow, invoiceID: invoiceID[0].InvoiceID});
			await update_todaysOrderRates.run();
			console.log("update_todaysOrderRates")
			}
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
	queries[queryName]?.run();
		//Table3.tableData = queries[queryName].data
	storeValue('tableData', queries[queryName].data)
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
		const allItems = await get_selected_printer_item_all.run()
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
	},
	fixThis: async () => {
		const customerItems = await get_cust_fix.run();
		const printItems = await get_print_fix.run();
		const printerInfo = await get_all_printer_fix.run();

		// const itemsList = [];

		for(const item of customerItems){
			if(item.Printer !== "CANCELLED" && item.Printer !== null){
				// const printer = printerInfo.find(printer => printer.PrinterName === item.Printer)
				const printIt = printItems.find(printItem => printItem.Id === item.Id)
				if(!printIt){
					console.log(`JG missing printerItem ${item.Id}`)
				}
				// if(printIt){
				// itemsList.push({
				// printerId: printer.Id,
				// printerTier: printer.tier_level_id,
				// productId: printIt.ProductID,
				// itemId: item.Id,
				// qty: item.Qty
				// })
				// }
			}

		}
		// console.log("JG", itemsList)
		// await storeValue('printerItemsList',JSON.parse(JSON.stringify(itemsList).replaceAll("'", "''")));	
		// await set_printer_price.run();																		
	}
}
