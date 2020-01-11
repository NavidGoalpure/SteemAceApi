module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        childnum: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

    }, )

    User.prototype.canAdd = function () {
        return this.childnum < 4;
    }
    User.prototype.inc = async function (field = 'childnum', num = 1) {
        this[field] += num;
        await this.save();
    }
    User.prototype.dec = async function (field = 'childnum', num = -1) {
        this[field] += num;
        await this.save();
    }

    User.associate = function (models) {

        models.User.belongsTo(models.User, {
            foreignKey: 'parentId',
            targetKey: 'id',
            as: 'parent'

        })

        models.User.hasMany(models.User, {
            foreignKey: 'parentId',
            sourceKey: 'id',
            as: 'childs'
        });
    }

    return User;
};
