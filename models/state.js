module.exports = (sequelize, DataTypes) => {
    const State = sequelize.define('State', {

        state: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        chatId: {
            type: DataTypes.BIGINT(11),
            allowNull: false,
            unique: true
        },

    }, {})


    State.associate = function (models) {


        models.State.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        })
        models.User.hasOne(models.State, {
            foreignKey: 'userId',
            as: 'state'
        })
    }

    return State;
};
