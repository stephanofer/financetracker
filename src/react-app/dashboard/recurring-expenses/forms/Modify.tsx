

interface CreateDebtFormProps {
  handleClose: () => void;
}

export function ModifyRecurringExpense({ handleClose }: CreateDebtFormProps) {
  return (
    <div>
      <h2>Modificar Gasto Recurrente</h2>
      <button onClick={handleClose}>Cerrar</button>
    </div>
  )
}
