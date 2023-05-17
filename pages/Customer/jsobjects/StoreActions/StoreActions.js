export default {
	myFun1: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
		await Save_Data.run({currentRow});
		await get_custpricelist.run(()			=> { showAlert('Well done!.','success')}, () => {});

	},
	myFun2: async (currentRow) => {
		await storeValue("rowUpdate",currentRow);
	},
		runselect: async () => {
		resetWidget('Select1')
		resetWidget('Table3')
			Query1.run()
		StoreActions.runQuery('Query1')
	},
	runQuery: async (queryName) => {
		const queries = {
		"Query1": Query1,
		"Query2": Query2
		}
		await queries[queryName]?.run();
		//Table3.tableData = queries[queryName].data
		await storeValue('tableData', queries[queryName].data)
	}
}
