
function CreateBoardPanel () {

    return (
        <div className="create-board-panel">
            <h2>Создание новой доски</h2>
            <input type="text" placeholder="Название доски" />
            <input type="color" />
            <button className="create-button">Создать</button>
        </div>
    )

}

export default CreateBoardPanel;